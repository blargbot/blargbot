import { EventEmitter } from 'eventemitter3';
import child_process, { ChildProcess, Serializable } from 'child_process';
import { Snowflake } from 'catflake';
import { snowflake } from '../newbu';

export class WorkerSpawner extends EventEmitter {
    readonly #coreEmit: (type: string, id: Snowflake, data: JToken) => boolean;
    #process?: ChildProcess;

    public get started() { return this.#process !== undefined; }
    public get alive() { return this.#process && !this.#process.killed; }

    public readonly args: string[];
    public readonly env: NodeJS.ProcessEnv;

    constructor(
        public readonly file: string
    ) {
        super();
        this.args = [...process.execArgv];
        this.env = { ...process.env };
        this.#coreEmit = (type: string, id: Snowflake, data: JToken) =>
            super.emit(type, { id, data });
    }

    start(timeoutMS: number = 10000) {
        if (this.started)
            throw new Error('The child process has already been started!');

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

        return new Promise<JToken>((resolve, reject) => {
            this.once('alive', ({ data }) => resolve(data));
            this.once('stopped', ({ id, data }) => reject(new Error(`Child process has stopped with code ${id}: ${data}`)));
            setTimeout(() => reject(new Error('Child process failed to send ready in time')), timeoutMS);
        });
    }

    kill(code: NodeJS.Signals | number = 'SIGTERM') {
        if (!this.alive)
            throw new Error('The child process is not running');

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