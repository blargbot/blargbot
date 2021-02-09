import { Snowflake } from 'catflake';
import { TypedEventEmitter } from './TypedEventEmitter';
import { snowflake } from '../../newbu';
import { ContractKey, MasterMessageHandler, WorkerContract, WorkerPayload, MasterPayload, MasterMessage, WorkerMessage, MasterMessageHandlers } from './Contract';

export abstract class BaseWorker<TContract extends WorkerContract> extends TypedEventEmitter<MasterMessageHandlers<TContract>> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #process: NodeJS.WorkerProcess

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

        this.#process.on('unhandledRejection', (err) =>
            this.logger.error('Unhandled Promise Rejection: Promise' + JSON.stringify(err)));

        this.logger.addPostHook(({ text, level, timestamp }) => {
            this.send('log', snowflake.create(), { text, level, timestamp });
            return null;
        });

        this.send('alive', snowflake.create(), null);
    }

    public send<T extends ContractKey<TContract>>(type: T, id: Snowflake, data: WorkerPayload<TContract, T>): boolean {
        return this.#process.send(<WorkerMessage<TContract, T>>{ type, id, data });
    }

    public start(): void {
        this.installListeners();
        this.send('ready', snowflake.create(), 'Hello!');
    }

    protected installListeners(): void {
        this.#process.on('message', <T extends ContractKey<TContract>>({ type, data, id }: MasterMessage<TContract, T>) =>
            this.emit(type, data, m => this.send(type, id, m), id));
    }

    protected request<T extends ContractKey<TContract>>(type: T, data: WorkerPayload<TContract, T>, timeoutMS = 10000): Promise<MasterPayload<TContract, T>> {
        const requestId = snowflake.create();
        return new Promise<MasterPayload<TContract, T>>((resolve, reject) => {
            const handler: MasterMessageHandler<TContract, T> = (data, _, id) => {
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

export function isWorkerProcess(process: NodeJS.Process): process is NodeJS.WorkerProcess {
    return typeof process.send === 'function';
}