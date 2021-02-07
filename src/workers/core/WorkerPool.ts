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

    public async spawn(id: number, timeoutMS = 10000): Promise<TWorker> {
        if (id >= this.workerCount)
            throw new Error(`${this.type} ${id} doesnt exist`);

        this.kill(id);
        const connection = this.createWorker(id);
        this.#workers.set(id, connection);
        await connection.connect(timeoutMS);
        return connection;
    }

    protected abstract createWorker(id: number): TWorker;

    public kill(id: number): void {
        this.#workers.get(id)?.kill();
        this.#workers.delete(id);
    }

    public async spawnAll(timeoutMS = 10000): Promise<TWorker[]> {
        return await Promise.all(getRange(0, this.workerCount - 1)
            .map(id => this.spawn(id, timeoutMS)));
    }
}