import { EventEmitter } from 'eventemitter3';
import child_process, { ChildProcess, Serializable } from 'child_process';
import { Snowflake } from 'catflake';
import { snowflake } from '../../newbu';
import { Timer } from '../../structures/Timer';
import { WorkerMessageHandler } from './BaseWorker';
import { Moment } from 'moment-timezone';
import moment from 'moment';

export abstract class WorkerConnection extends EventEmitter {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #coreEmit: (type: string, id: Snowflake, data: unknown) => boolean;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly file: string;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #process?: ChildProcess;

    public get connected(): boolean { return this.#process?.connected ?? false; }

    public readonly args: string[];
    public readonly env: NodeJS.ProcessEnv;
    public readonly created: Moment;

    protected constructor(
        public readonly id: number,
        public readonly worker: string,
        public readonly logger: CatLogger
    ) {
        super();
        this.created = moment();
        this.args = [...process.execArgv];
        this.env = { ...process.env };
        this.file = require.resolve(`../../entrypoint/${this.worker}`);
        this.on('alive', () => this.logger.worker(`${this.worker} worker (ID: ${this.id}) is alive`));
        this.#coreEmit = (type, id, data) => {
            return super.emit(type, data, (reply: unknown) => this.send(type, id, reply), id);
        };
    }

    public async connect(timeoutMS = 10000): Promise<unknown> {
        if (this.#process)
            throw new Error('Cannot connect to a worker multiple times. Create a new instance for a new worker');

        this.logger.worker(`Spawning a new ${this.worker} worker (ID: ${this.id})`);
        const timer = new Timer();
        timer.start();
        this.#process = child_process.fork(this.file, {
            env: this.env,
            execArgv: this.args
        });

        Object.freeze(this.args);
        Object.freeze(this.env);

        this.#process.on('message', (message) => {
            if (!isMessage(message))
                return;
            this.#coreEmit(message.type, message.id, message.data);
        });

        this.#process.on('exit', (code, signal) => this.#coreEmit('exit', snowflake.create(), { code, signal }));
        this.#process.on('close', (code, signal) => this.#coreEmit('close', snowflake.create(), { code, signal }));
        this.#process.on('disconnect', () => this.#coreEmit('disconnect', snowflake.create(), null));
        this.#process.on('kill', (code) => this.#coreEmit('kill', snowflake.create(), code));
        this.#process.on('error', (error) => this.#coreEmit('error', snowflake.create(), { ...error }));

        try {
            const result = await new Promise<unknown>((resolve, reject) => {
                this.once('ready', data => resolve(data));
                this.once('stopped', (data, _, id) => reject(new Error(`Child process has stopped with code ${id}: ${data}`)));
                setTimeout(() => reject(new Error('Child process failed to send ready in time')), timeoutMS);
            });
            timer.end();
            this.logger.worker(`${this.worker} worker (ID: ${this.id}) is ready after ${timer.elapsed}ms and said ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            this.#process.kill();
            this.logger.error(`${this.worker} worker (ID: ${this.id}) failed to start: ${err?.stack ?? err}`);
            throw err;
        }
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

    public kill(code: NodeJS.Signals | number = 'SIGTERM'): void {
        if (this.#process === undefined || !this.#process.connected)
            throw new Error('The child process is not connected');

        this.logger.worker(`Killing ${this.worker} worker (ID: ${this.id})`);
        this.#process.kill(code);
    }

    public emit(): never {
        throw new Error('Emitting custom events isnt allowed on this object');
    }

    public send(type: string, id: Snowflake, data: unknown): boolean {
        if (this.#process === undefined)
            throw new Error('Child process has not been started yet');
        return this.#process.send({ type, id, data });
    }

    public request<T = unknown>(type: string, data: unknown, timeoutMS = 10000): Promise<T> {
        const requestId = snowflake.create();
        return new Promise<T>((resolve, reject) => {
            const handler: WorkerMessageHandler<T> = (data, _, id) => {
                if (id === requestId) {
                    resolve(data);
                    this.off(type, handler);
                }
            };

            this.on(type, handler);
            setTimeout(() => reject(new Error(`Child failed to respond to '${type}' in time`)), timeoutMS);
            this.send(type, requestId, data);
        });
    }
}

function isMessage(value: Serializable): value is { type: string, id: Snowflake, data: unknown } {
    if (typeof value !== 'object')
        return false;

    const _value = <JObject>value;
    return typeof _value['type'] === 'string'
        && ['string', 'bigint'].includes(typeof _value['id']);
}