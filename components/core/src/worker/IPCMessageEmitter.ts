import { ChildProcess } from 'node:child_process';

import { ProcessMessage, ProcessMessageContext, ProcessMessageHandler } from '@blargbot/core/types.js';
import { snowflake } from '@blargbot/core/utils/index.js';
import type { Snowflake } from 'catflake';
import { EventEmitter } from 'eventemitter3';

export class IPCMessageEmitter {
    readonly #events: EventEmitter;
    #process?: NodeJS.Process | ChildProcess;
    #sender?: (message: ProcessMessage) => boolean;

    public get process(): NodeJS.Process | ChildProcess | undefined { return this.#process; }
    public set process(value: NodeJS.Process | ChildProcess | undefined) {
        if (this.#process !== undefined)
            throw new Error('Already attached to a process!');
        if (value === undefined)
            return;
        this.#attach(value);
    }

    public constructor(process?: NodeJS.Process | ChildProcess) {
        this.#events = new EventEmitter();

        if (process !== undefined)
            this.#attach(process);
    }

    #attach(process: NodeJS.Process | ChildProcess): void {
        this.#process = process;

        process.on('message', ({ type, data, id }: ProcessMessage) =>
            this.emit(type, data, id));

        this.#sender = isWorkerProcess(process)
            ? message => process.send(message)
            : () => false;

        if (!('execPath' in process)) {
            const relay = (code: string, data?: unknown): void => {
                this.emit(code, data, snowflake.create());
            };
            process.on('exit', (code, signal) => relay('exit', { code, signal }));
            process.on('close', (code, signal) => relay('close', { code, signal }));
            process.on('disconnect', () => relay('disconnect'));
            process.on('kill', code => relay('kill', code));
            process.on('error', error => relay('error', error));
        }
    }

    public send(type: string, data?: unknown, id?: Snowflake): boolean {
        if (this.#sender === undefined)
            throw new Error('No process has been attached to yet');

        return this.#sender({ type, id: id ?? snowflake.create(), data });
    }

    protected emit(type: string, data: unknown, id: Snowflake): boolean {
        const context: ProcessMessageContext<unknown, unknown> = { data, id, reply: (data) => this.send(type, data, id) };
        const result = this.#events.emit(`message_${type}`, context);
        return this.#events.emit('any', type, context) || result;
    }

    public on(type: string, handler: ProcessMessageHandler): this {
        this.#events.on(`message_${type}`, handler);
        return this;
    }

    public once(type: string, handler: ProcessMessageHandler): this {
        this.#events.once(`message_${type}`, handler);
        return this;
    }

    public off(type: string, handler: ProcessMessageHandler): this {
        this.#events.off(`message_${type}`, handler);
        return this;
    }

    public async request(type: string, data: unknown, timeoutMS = 10000): Promise<unknown> {
        const requestId = snowflake.create();
        const result = await new Promise<{ success: true; data: unknown; } | { success: false; }>(res => {
            const handler: ProcessMessageHandler = ({ data, id }) => {
                if (id === requestId) {
                    this.off(type, handler);
                    res({ success: true, data: data } as const);
                }
            };

            this.on(type, handler);
            setTimeout(() => {
                this.off(type, handler);
                res({ success: false });
            }, timeoutMS);
            this.send(type, data, requestId);
        });

        if (!result.success)
            throw new Error(`Failed to get a response to '${type}' in time (${timeoutMS}ms)`);

        return result.data;
    }
}

export function isWorkerProcess(process: NodeJS.Process | ChildProcess): process is NodeJS.WorkerProcess | ChildProcess {
    return typeof process.send === 'function';
}
