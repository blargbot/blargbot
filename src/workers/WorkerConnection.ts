import { EventEmitter } from 'eventemitter3';
import child_process, { ChildProcess, Serializable } from 'child_process';
import { Snowflake } from 'catflake';
import { snowflake } from '../newbu';
import { Timer } from '../structures/Timer';

export type WorkerMessageHandler = (message: { id: Snowflake, data: JToken }) => void;

export class WorkerConnection extends EventEmitter {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #coreEmit: (type: string, id: Snowflake, data: JToken) => boolean;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly file: string;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #process?: ChildProcess;

    public get connected(): boolean { return this.#process?.connected ?? false; }

    public readonly args: string[];
    public readonly env: NodeJS.ProcessEnv;

    public constructor(
        public readonly id: Snowflake,
        public readonly worker: string,
        public readonly logger: CatLogger
    ) {
        super();
        this.args = [...process.execArgv];
        this.env = { ...process.env };
        this.file = require.resolve(`../workers/${this.worker}`);
        this.#coreEmit = (type: string, id: Snowflake, data: JToken) =>
            super.emit(type, { id, data });
    }

    public async connect(timeoutMS = 10000): Promise<JToken> {
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
            const result = await new Promise<JToken>((resolve, reject) => {
                this.once('alive', ({ data }) => resolve(data));
                this.once('stopped', ({ id, data }) => reject(new Error(`Child process has stopped with code ${id}: ${data}`)));
                setTimeout(() => reject(new Error('Child process failed to send ready in time')), timeoutMS);
            });
            timer.end();
            this.logger.worker(`${this.worker} worker (ID: ${this.id}) is alive after ${timer.elapsed}ms and said ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            this.logger.error(`${this.worker} worker (ID: ${this.id}) failed to start: ${err?.stack ?? err}`);
            throw err;
        }
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

    public kill(code: NodeJS.Signals | number = 'SIGTERM'): void {
        if (this.#process === undefined || !this.#process.connected)
            throw new Error('The child process is not connected');

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

    public request(type: string, data: JToken, timeoutMS = 10000): Promise<JToken> {
        const requestId = snowflake.create();
        return new Promise<JToken>((resolve, reject) => {
            const handler: WorkerMessageHandler = ({ id, data }) => {
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

function isMessage(value: Serializable): value is { type: string, id: Snowflake, data?: JObject } {
    if (typeof value !== 'object')
        return false;

    const _value = <JObject>value;
    return typeof _value['type'] === 'string'
        && ['string', 'bigint'].includes(typeof _value['id']);
}