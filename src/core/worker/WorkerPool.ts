import { Logger } from '@core/Logger';
import { getRange } from '@core/utils';
import EventEmitter from 'eventemitter3';

import { WorkerConnection, WorkerState } from './WorkerConnection';

export abstract class WorkerPool<TWorker extends WorkerConnection> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #workers: Map<number, TWorker>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #events: EventEmitter;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #inProgress: Map<number, boolean>;

    public *[Symbol.iterator](): IterableIterator<TWorker | undefined> {
        for (let i = 0; i < this.workerCount; i++)
            yield this.#workers.get(i);
    }

    public constructor(
        public readonly type: string,
        public readonly workerCount: number,
        public readonly defaultTimeout: number,
        public readonly logger: Logger
    ) {
        this.#workers = new Map();
        this.#events = new EventEmitter();
        this.#inProgress = new Map();
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
        const worker = this.tryGet(id);
        if (worker === undefined)
            throw new Error(`${this.type} ${id} has not yet been spawned`);

        return worker;
    }

    public tryGet(id: number): TWorker | undefined {
        return this.#workers.get(id);
    }

    public async spawn(id: number, timeoutMS = this.defaultTimeout): Promise<TWorker> {
        if (id >= this.workerCount)
            throw new Error(`${this.type} ${id} doesnt exist`);
        if (this.#inProgress.get(id) === true)
            throw new Error(`${this.type} ${id} is already spawning`);

        this.#inProgress.set(id, true);
        try {
            const worker = this.createWorker(id);
            const oldWorker = this.#workers.get(id);
            this.#workers.delete(id);
            this.#events.emit('spawningworker', worker);
            await worker.connect(timeoutMS);
            this.#workers.set(id, worker);
            if (oldWorker !== undefined) {
                this.#events.emit('killingworker', oldWorker);
                if (oldWorker.state === WorkerState.RUNNING)
                    await oldWorker.kill();
                this.#events.emit('killedworker', worker);
            }
            this.#events.emit('spawnedworker', worker);
            return worker;
        } finally {
            this.#inProgress.set(id, false);
        }
    }

    protected abstract createWorker(id: number): TWorker;

    public async kill(id: number): Promise<void> {
        const worker = this.#workers.get(id);
        if (worker === undefined)
            return;

        this.#workers.delete(id);

        this.#events.emit('killingworker', worker);
        if (worker.state === WorkerState.RUNNING)
            await worker.kill();
        this.#events.emit('killedworker', worker);
    }

    public async spawnAll(timeoutMS = this.defaultTimeout): Promise<TWorker[]> {
        return await Promise.all(getRange(0, this.workerCount - 1)
            .map(id => this.spawn(id, timeoutMS)));
    }

    public async killAll(): Promise<void> {
        await Promise.all(getRange(0, this.workerCount - 1)
            .map(id => this.kill(id)));
    }

    public forEach(callback: (id: number, worker: TWorker | undefined) => void): void;
    public forEach(callback: (id: number, worker: TWorker | undefined) => Promise<void>): Promise<void>;
    public forEach(callback: (id: number, worker: TWorker | undefined) => Promise<void> | void): Promise<void> | void {
        const results: Array<PromiseLike<void>> = [];
        let i = 0;
        for (const worker of this) {
            const result = callback(i++, worker);
            if (isPromiseLike(result))
                results.push(result);
        }
        if (results.length > 0)
            return Promise.all(results).then(() => undefined);
    }
}

function isPromiseLike<T>(value: T | PromiseLike<T>): value is PromiseLike<T> {
    return typeof value === 'object' && 'then' in value && typeof value.then === 'function';
}
