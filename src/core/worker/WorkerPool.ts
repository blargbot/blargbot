import { IPCContracts } from '@blargbot/core/types';
import { getRange } from '@blargbot/core/utils';
import { Logger } from '@blargbot/logger';
import EventEmitter from 'eventemitter3';

import { Semaphore } from '../Semaphore';
import { WorkerConnection } from './WorkerConnection';

export const enum RespawnStrategy {
    SPAWN_THEN_KILL,
    KILL_THEN_SPAWN
}

export interface WorkerPoolOptions {
    readonly type: string;
    readonly workerCount: number;
    readonly defaultTimeout: number;
    readonly logger: Logger;
    readonly respawnStrategy?: RespawnStrategy;
    readonly maxConcurrentSpawning?: number;
}

type WorkerPoolEvents = 'killingWorker' | 'killedWorker' | 'spawningWorker' | 'spawnedWorker'

export abstract class WorkerPool<Worker extends WorkerConnection<IPCContracts>> {
    public readonly workerCount: number;
    public readonly type: string;
    public readonly defaultTimeout: number;
    public readonly logger: Logger;
    readonly #workers: Map<number, Worker>;
    readonly #events: EventEmitter<{ [P in WorkerPoolEvents]: [Worker] }>;
    readonly #inProgress: Map<number, boolean>;
    readonly #respawnStrategy: RespawnStrategy;
    readonly #lock: Semaphore;

    public *[Symbol.iterator](): IterableIterator<Worker | undefined> {
        for (let i = 0; i < this.workerCount; i++)
            yield this.#workers.get(i);
    }

    public constructor(options: WorkerPoolOptions) {
        this.workerCount = options.workerCount;
        this.type = options.type;
        this.defaultTimeout = options.defaultTimeout;
        this.logger = options.logger;
        this.#workers = new Map();
        this.#events = new EventEmitter();
        this.#inProgress = new Map();
        this.#respawnStrategy = options.respawnStrategy ?? RespawnStrategy.SPAWN_THEN_KILL;
        this.#lock = new Semaphore(options.maxConcurrentSpawning ?? Infinity);
    }

    public on(type: WorkerPoolEvents, handler: (worker: Worker) => void): this {
        this.#events.on(type, handler);
        return this;
    }

    public once(type: WorkerPoolEvents, handler: (worker: Worker) => void): this {
        this.#events.once(type, handler);
        return this;
    }

    public off(type: WorkerPoolEvents, handler: (worker: Worker) => void): this {
        this.#events.off(type, handler);
        return this;
    }

    public get(id: number): Worker {
        const worker = this.tryGet(id);
        if (worker === undefined)
            throw new Error(`${this.type} ${id} has not yet been spawned`);

        return worker;
    }

    public tryGet(id: number): Worker | undefined {
        return this.#workers.get(id);
    }

    async #killWorker(worker: Worker): Promise<void> {
        this.#events.emit('killingWorker', worker);
        await worker.kill(undefined);
        this.#events.emit('killedWorker', worker);
    }

    public async spawn(id: number, timeoutMs = this.defaultTimeout): Promise<Worker> {
        if (id >= this.workerCount)
            throw new Error(`${this.type} ${id} doesnt exist`);
        if (this.#inProgress.get(id) === true)
            throw new Error(`${this.type} ${id} is already spawning`);

        this.#inProgress.set(id, true);
        try {
            await this.#lock.wait();
            try {
                const worker = this.createWorker(id);
                const oldWorker = this.#workers.get(id);
                this.#workers.delete(id);
                if (oldWorker !== undefined && this.#respawnStrategy === RespawnStrategy.KILL_THEN_SPAWN)
                    await this.#killWorker(oldWorker);

                this.#events.emit('spawningWorker', worker);
                await worker.connect(timeoutMs);
                this.#workers.set(id, worker);
                this.#events.emit('spawnedWorker', worker);

                if (oldWorker !== undefined && this.#respawnStrategy === RespawnStrategy.SPAWN_THEN_KILL)
                    await this.#killWorker(oldWorker);

                return worker;
            } finally {
                this.#lock.release();
            }
        } finally {
            this.#inProgress.set(id, false);
        }
    }

    protected abstract createWorker(id: number): Worker;

    public async kill(id: number): Promise<void> {
        const worker = this.#workers.get(id);
        if (worker === undefined)
            return;

        this.#workers.delete(id);

        await this.#killWorker(worker);
    }

    public async spawnAll(timeoutMs = this.defaultTimeout): Promise<Worker[]> {
        return await Promise.all(getRange(0, this.workerCount - 1)
            .map(id => this.spawn(id, timeoutMs)));
    }

    public async killAll(): Promise<void> {
        await Promise.all(getRange(0, this.workerCount - 1)
            .map(id => this.kill(id)));
    }

    public forEach(callback: (id: number, worker: Worker | undefined) => Promise<void>): Promise<void>;
    public forEach(callback: (id: number, worker: Worker | undefined) => void): void;
    public forEach(callback: (id: number, worker: Worker | undefined) => Promise<void> | void): Promise<void> | void {
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
