import { EventEmitter } from 'eventemitter3';
import { getRange } from '../../newbu';
import { WorkerConnection } from './WorkerConnection';

export abstract class WorkerPool<TWorker extends WorkerConnection> extends EventEmitter {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #workers: Map<number, TWorker>;

    public *[Symbol.iterator](): IterableIterator<TWorker | undefined> {
        for (let i = 0; i < this.workerCount; i++)
            yield this.#workers.get(i);
    }

    public constructor(
        public readonly type: string,
        public readonly workerCount: number,
        public readonly defaultTimeout: number,
        public readonly logger: CatLogger
    ) {
        super();
        this.#workers = new Map();
    }

    public get(id: number): TWorker {
        if (id >= this.workerCount)
            throw new Error(`${this.type} ${id} doesnt exist`);

        const worker = this.#workers.get(id);
        if (!worker)
            throw new Error(`${this.type} ${id} has not yet been spawned`);

        return worker;
    }

    public async spawn(id: number, timeoutMS = this.defaultTimeout): Promise<TWorker> {
        if (id >= this.workerCount)
            throw new Error(`${this.type} ${id} doesnt exist`);

        this.kill(id);
        this.emit('spawningworker', id);
        const worker = this.createWorker(id);
        this.#workers.set(id, worker);
        await worker.connect(timeoutMS);
        this.emit('spawnedworker', id, worker);
        return worker;
    }

    protected abstract createWorker(id: number): TWorker;

    public kill(id: number): void {
        const worker = this.#workers.get(id);
        if (!worker)
            return;

        this.#workers.delete(id);

        if (worker.connected) {
            this.emit('killingworker', worker);
            worker.kill();
            this.emit('killedworker', worker);
        }
    }

    public async spawnAll(timeoutMS = this.defaultTimeout): Promise<TWorker[]> {
        return await Promise.all(getRange(0, this.workerCount - 1)
            .map(id => this.spawn(id, timeoutMS)));
    }

    public forEach(callback: (id: number, worker: TWorker | undefined) => void): void;
    public forEach(callback: (id: number, worker: TWorker | undefined) => Promise<void>): Promise<void>;
    public forEach(callback: (id: number, worker: TWorker | undefined) => Promise<void> | void): Promise<void> | void {
        const results: Promise<void>[] = [];
        let i = 0;
        for (const worker of this) {
            const result = callback(i++, worker);
            if (result !== undefined)
                results.push(result);
        }
        if (results.length > 0)
            return Promise.all(results).then(() => undefined);
    }
}