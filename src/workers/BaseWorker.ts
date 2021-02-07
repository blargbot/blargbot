import { Snowflake } from 'catflake';
import { EventEmitter } from 'eventemitter3';
import { snowflake } from '../newbu';

export type WorkerMessageHandler = (message: { id: Snowflake, data: JToken }) => void;

export abstract class BaseWorker extends EventEmitter {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #process: NodeJS.WorkerProcess
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #coreEmit: (type: string, id: Snowflake, data: JToken) => boolean;

    public get id(): number { return this.#process.pid; }
    public get env(): NodeJS.ProcessEnv { return this.#process.env; }
    public get memoryUsage(): NodeJS.MemoryUsage { return this.#process.memoryUsage(); }

    public constructor(
        public readonly logger: CatLogger
    ) {
        super();
        if (!isWorkerProcess(process))
            throw new Error('Worker processes must be able to send messages to their parents');

        this.#process = process;
        this.#coreEmit = (type: string, id: Snowflake, data: JToken) =>
            super.emit(type, { id, data });

        this.#process.on('unhandledRejection', (err) =>
            this.logger.error('Unhandled Promise Rejection: Promise' + JSON.stringify(err)));

        this.logger.addPostHook(({ text, level, timestamp }) => {
            this.send('log', snowflake.create(), { text, level, timestamp });
            return null;
        });

        this.send('alive', snowflake.create(), 'Hello!');
    }

    public send(type: string, id: Snowflake, data: unknown): boolean {
        return this.#process.send({ type, id, data });
    }

    public start(): void {
        this.#process.on('message', ({ type, id, data }) =>
            this.#coreEmit(type, id, data));
    }

    public on(event: string, handler: WorkerMessageHandler): this {
        return super.on(event, handler);
    }

    public once(event: string, handler: WorkerMessageHandler): this {
        return super.once(event, handler);
    }

    public addListener(event: string, handler: WorkerMessageHandler): this {
        return super.addListener(event, handler);
    }

    public off(event: string, handler: WorkerMessageHandler): this {
        return super.off(event, handler);
    }

    public removeListener(event: string, handler: WorkerMessageHandler): this {
        return super.removeListener(event, handler);
    }

    public emit(): never {
        throw new Error('Emitting custom events isnt allowed on this object');
    }
}

export function isWorkerProcess(process: NodeJS.Process): process is NodeJS.WorkerProcess {
    return typeof process.send === 'function';
}