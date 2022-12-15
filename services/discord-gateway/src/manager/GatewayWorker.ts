import child_process from 'node:child_process';
import stream from 'node:stream';

import type { GatewayMessageBroker, WorkerMessageTypes } from '../GatewayMessageBroker.js';
import { workerPath } from '../worker/index.js';

export class GatewayWorker {
    readonly #id: number;
    readonly #messages: GatewayMessageBroker;
    readonly #worker: child_process.ChildProcess;
    #started: Promise<void>;
    #stopped: Promise<void>;

    public constructor(id: number, lastShardId: number, messages: GatewayMessageBroker) {
        this.#id = id;
        this.#messages = messages;
        this.#worker = child_process.fork(workerPath, {
            env: {
                ...process.env,
                WORKER_ID: id.toString(),
                LAST_SHARD_ID: lastShardId.toString(),
                MANAGER_ID: messages.managerId
            },
            stdio: 'pipe'
        });

        this.#worker.stderr?.pipe(prependLine(`[Worker ${id}]`)).pipe(process.stderr);
        this.#worker.stdout?.pipe(prependLine(`[Worker ${id}]`)).pipe(process.stdout);
        this.#worker.on('disconnect', () => this.#worker.kill());
        this.#started = this.#waitStarted();
        this.#stopped = this.#waitStopped();
    }

    async #waitForMessageErrorOrExit(check: (message: child_process.Serializable) => boolean): Promise<void> {
        await new Promise<void>((res, rej) => {
            const reject = (reason?: unknown): void => {
                rej(reason);
                detach();
                if (this.#worker.connected)
                    this.#worker.kill();
            };
            const handleMessage = (message: child_process.Serializable): void => {
                if (check(message)) {
                    res();
                    detach();
                }
            };
            const attach = (): void => {
                this.#worker.once('exit', reject);
                this.#worker.once('error', reject);
                this.#worker.on('message', handleMessage);
            };
            const detach = (): void => {
                this.#worker.off('exit', reject);
                this.#worker.off('error', reject);
                this.#worker.off('message', handleMessage);
            };
            attach();
        });
    }

    async #waitStarted(): Promise<void> {
        await this.#waitForMessageErrorOrExit(m => m === 'started');
        this.#stopped = this.#waitStopped();
    }

    async #waitStopped(): Promise<void> {
        await this.#waitForMessageErrorOrExit(m => m === 'stopped');
        this.#started = this.waitStarted();
    }

    public async waitStarted(): Promise<void> {
        await this.#started;
    }

    public async waitStopped(): Promise<void> {
        await this.#stopped;
    }

    public async send<Type extends keyof WorkerMessageTypes>(type: Type, message: WorkerMessageTypes[Type]): Promise<void> {
        await this.#started;
        await this.#messages.sendWorkerCommand(type, this.#id, message);
    }

    public async shutdown(): Promise<void> {
        if (!this.#worker.connected)
            return;
        this.#worker.kill('SIGTERM');
        await this.waitStopped();
    }
}

function prependLine(text: string): stream.Transform {
    return new stream.Transform({
        transform(chunk: string | Uint8Array, _encoding, callback) {
            callback(null, chunk.toString().replaceAll(/(?<=\n)/g, text));
        }
    });
}
