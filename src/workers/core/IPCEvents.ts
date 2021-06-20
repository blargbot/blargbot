/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { EventEmitter } from 'eventemitter3';
import { ChildProcess } from 'child_process';
import { snowflake } from '../../utils';

export type ProcessMessage = { type: string, id: Snowflake, data: unknown };
export type ProcessMessageHandler = (data: any, id: Snowflake, reply: (data: any) => void) => void;
export type AnyProcessMessageHandler = (event: string, ...args: Parameters<ProcessMessageHandler>) => void;

export class IPCEvents {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #events: EventEmitter;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #sender?: (message: ProcessMessage) => boolean;

    public constructor(process?: NodeJS.Process) {
        this.#events = new EventEmitter();
        if (process !== undefined)
            this.attach(process);
    }

    protected attach(process: NodeJS.Process | ChildProcess): void {
        if (this.#sender !== undefined)
            throw new Error('Already attached to a process!');

        process.on('message', ({ type, data, id }: ProcessMessage) =>
            this.emit(type, data, id));

        this.#sender = isWorkerProcess(process) ? message => process.send(message)
            : process.env.IGNORE_SEND ? () => false
                : () => { throw new Error('Process does not support sending messages'); };
    }

    public send(type: string, data?: unknown, id?: Snowflake): boolean {
        if (this.#sender === undefined)
            throw new Error('No process has been attached to yet');

        return this.#sender({ type, id: id ?? snowflake.create(), data });
    }

    protected emit(type: string, data: unknown, id: Snowflake): boolean {
        const args: Parameters<ProcessMessageHandler> = [data, id, reply => this.send(type, reply, id)];
        const result = this.#events.emit(`message_${type}`, ...args);
        return this.#events.emit('any', type, ...args) || result;
    }

    public on(type: string, handler: ProcessMessageHandler): this {
        this.#events.on(`message_${type}`, handler);
        return this;
    }

    public onAny(handler: AnyProcessMessageHandler): this {
        this.#events.on('any', handler);
        return this;
    }

    public once(type: string, handler: ProcessMessageHandler): this {
        this.#events.once(`message_${type}`, handler);
        return this;
    }

    public onceAny(handler: AnyProcessMessageHandler): this {
        this.#events.once('any', handler);
        return this;
    }

    public off(type: string, handler: ProcessMessageHandler): this {
        this.#events.off(`message_${type}`, handler);
        return this;
    }

    public offAny(handler: AnyProcessMessageHandler): this {
        this.#events.off('any', handler);
        return this;
    }

    public async request(type: string, data: unknown, timeoutMS = 10000): Promise<unknown> {
        const requestId = snowflake.create();
        try {
            return await new Promise<unknown>((resolve, reject) => {
                const handler: ProcessMessageHandler = (data, id) => {
                    if (id === requestId) {
                        resolve(data);
                        this.off(type, handler);
                    }
                };

                this.on(type, handler);
                setTimeout(() => {
                    this.off(type, handler);
                    reject(new Error(`Failed to get a response to '${type}' in time`));
                }, timeoutMS);
                this.send(type, data, requestId);
            });
        } catch (err) {
            Error.captureStackTrace(err);
            throw err;
        }
    }
}

export function isWorkerProcess(process: NodeJS.Process | ChildProcess): process is NodeJS.WorkerProcess | ChildProcess {
    return typeof process.send === 'function';
}