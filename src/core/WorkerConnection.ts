import { EventEmitter } from 'eventemitter3';
import child_process, { ChildProcess, Serializable } from 'child_process';
import { Snowflake } from 'catflake';
import { snowflake } from '../newbu';
import { Timer } from '../structures/Timer';

export class WorkerConnection extends EventEmitter {
    readonly #coreEmit: (type: string, id: Snowflake, data: JToken) => boolean;
    readonly file: string;
    #process?: ChildProcess;

    public get connected() { return this.#process?.connected ?? false; }

    public readonly args: string[];
    public readonly env: NodeJS.ProcessEnv;

    constructor(
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

    async connect(timeoutMS: number = 10000) {
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

        this.#process.on('exit', (code, signal) => this.#coreEmit('exit', snowflake.create(), { code, signal }))
        this.#process.on('close', (code, signal) => this.#coreEmit('close', snowflake.create(), { code, signal }))
        this.#process.on('disconnect', () => this.#coreEmit('disconnect', snowflake.create(), 'Child was disconnected'));
        this.#process.on('kill', (code) => this.#coreEmit('kill', snowflake.create(), 'Child was killed'));
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

    kill(code: NodeJS.Signals | number = 'SIGTERM') {
        if (!this.connected)
            throw new Error('The child process is not connected');

        this.#process!.kill(code);
    }

    emit(): never {
        throw new Error('Emitting custom events isnt allowed on this object');
    }

    send(type: string, id: Snowflake, data: JToken) {
        if (this.#process === undefined)
            throw new Error('Child process has not been started yet');
        this.#process.send({ type, id, data });
    }

    request(type: string, data: JToken, timeoutMS: number = 10000) {
        const requestId = snowflake.create();
        return new Promise<JToken>((resolve, reject) => {
            const handler = ({ id, data }: { id: Snowflake, data: JToken }) => {
                if (id === requestId) {
                    resolve(data);
                    this.off(type, handler);
                }
            };

            this.on(type, handler);
            setTimeout(() => reject(new Error(`Child failed to respond to '${type}' in time`)), timeoutMS);
            this.send(type, requestId, data);
        })
    }
}

function isMessage(value: Serializable): value is { type: string, id: Snowflake, data?: JObject } {
    if (typeof value !== 'object')
        return false;

    const _value = <JObject>value;
    return typeof _value['type'] === 'string'
        && ['string', 'bigint'].includes(typeof _value['id']);
}