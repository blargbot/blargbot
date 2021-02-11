import { EventEmitter } from 'eventemitter3';
import { getRange } from '../../newbu';
import { ProcessMessageHandler } from './IPCEvents';
import { WorkerConnection } from './WorkerConnection';

export type WorkerPoolEventHandler<TWorker extends WorkerConnection> = (worker: TWorker, ...args: Parameters<ProcessMessageHandler>) => void;

export abstract class WorkerPool<TWorker extends WorkerConnection> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #workers: Map<number, TWorker>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #events: EventEmitter;

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
        this.#workers = new Map();
        this.#events = new EventEmitter();
    }

    public on(type: string, handler: (worker: TWorker) => void): this {
        this.#events.on(type, handler);
        return this;
    }

    public once(type: string, handler: (worker: TWorker) => void): this {
        this.#events.once(type, handler);
        return this;
    }

    public off(type: string, handler: (worker: TWorker) => void): this {
        this.#events.off(type, handler);
        return this;
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
        const worker = this.createWorker(id);
        this.#events.emit('spawningworker', worker);
        this.#workers.set(id, worker);
        await worker.connect(timeoutMS);
        this.#events.emit('spawnedworker', worker);
        return worker;
    }

    protected abstract createWorker(id: number): TWorker;

    public kill(id: number): void {
        const worker = this.#workers.get(id);
        if (!worker)
            return;

        this.#workers.delete(id);

        if (worker.connected) {
            this.#events.emit('killingworker', worker);
            worker.kill();
            this.#events.emit('killedworker', worker);
        }
    }

    public async spawnAll(timeoutMS = this.defaultTimeout): Promise<TWorker[]> {
        return await Promise.all(getRange(0, this.workerCount - 1)
            .map(id => this.spawn(id, timeoutMS)));
    }

    public killAll(): void {
        for (let i = 0; i < this.workerCount; i++)
            this.kill(i);
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