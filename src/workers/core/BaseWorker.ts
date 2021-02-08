import { Snowflake } from 'catflake';
import { EventEmitter } from 'eventemitter3';
import { snowflake } from '../../newbu';

export type WorkerMessageHandler<T = unknown> = (data: T, reply: (data: unknown) => void, id: Snowflake) => void;

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
        this.#coreEmit = (type: string, id: Snowflake, data: JToken) => {
            return super.emit(type, data, (reply: unknown) => this.send(type, id, reply), id);
        };

        this.#process.on('unhandledRejection', (err) =>
            this.logger.error('Unhandled Promise Rejection: Promise' + JSON.stringify(err)));

        this.logger.addPostHook(({ text, level, timestamp }) => {
            this.send('log', snowflake.create(), { text, level, timestamp });
            return null;
        });

        this.send('alive', snowflake.create(), null);
    }

    protected send(type: string, id: Snowflake, data: unknown): boolean {
        return this.#process.send({ type, id, data });
    }

    public start(): void {
        this.installListeners();
        this.send('ready', snowflake.create(), 'Hello!');
    }

    protected installListeners(): void {
        this.#process.on('message', ({ type, id, data }) => {
            this.#coreEmit(type, id, data);
        });
    }

    public on<T>(event: string, handler: WorkerMessageHandler<T>): this {
        return super.on(event, handler);
    }

    public once<T>(event: string, handler: WorkerMessageHandler<T>): this {
        return super.once(event, handler);
    }

    public addListener<T>(event: string, handler: WorkerMessageHandler<T>): this {
        return super.addListener(event, handler);
    }

    public off<T>(event: string, handler: WorkerMessageHandler<T>): this {
        return super.off(event, handler);
    }

    public removeListener<T>(event: string, handler: WorkerMessageHandler<T>): this {
        return super.removeListener(event, handler);
    }

    public emit(): never {
        throw new Error('Emitting custom events isnt allowed on this object');
    }
}

export function isWorkerProcess(process: NodeJS.Process): process is NodeJS.WorkerProcess {
    return typeof process.send === 'function';
}