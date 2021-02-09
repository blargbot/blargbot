import child_process, { ChildProcess } from 'child_process';
import { Snowflake } from 'catflake';
import { snowflake } from '../../newbu';
import { Timer } from '../../structures/Timer';
import { Moment } from 'moment-timezone';
import moment from 'moment';
import { ContractKey, WorkerContract, WorkerPayload, MasterPayload, WorkerMessageHandler, WorkerMessage, MasterMessage, WorkerMessageHandlers } from './Contract';
import { TypedEventEmitter } from './TypedEventEmitter';

export abstract class WorkerConnection<TContract extends WorkerContract> extends TypedEventEmitter<WorkerMessageHandlers<TContract>> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #process?: ChildProcess;

    public get connected(): boolean { return this.#process?.connected ?? false; }

    public readonly args: string[];
    public readonly env: NodeJS.ProcessEnv;
    public readonly created: Moment;
    public readonly file: string;

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
    }

    public async connect(timeoutMS: number): Promise<WorkerPayload<TContract, 'ready'>> {
        if (this.#process)
            throw new Error('Cannot connect to a worker multiple times. Create a new instance for a new worker');

        Object.freeze(this.args);
        Object.freeze(this.env);

        this.logger.worker(`Spawning a new ${this.worker} worker (ID: ${this.id})`);
        const timer = new Timer();
        timer.start();

        this.#process = child_process.fork(this.file, {
            env: this.env,
            execArgv: this.args
        });

        this.#process.on('message', <T extends ContractKey<TContract>>(message: WorkerMessage<TContract, T>) =>
            this.emitCore(message.type, message.id, message.data));

        const relay = <T extends ContractKey<TContract>>(code: T, data: WorkerPayload<TContract, T>): void => {
            this.logger.worker(`${this.worker} worker (ID: ${this.id}) sent ${code}`);
            this.emitCore(code, snowflake.create(), data);
        };
        this.#process.on('exit', (code, signal) => relay('exit', { code, signal }));
        this.#process.on('close', (code, signal) => relay('close', { code, signal }));
        this.#process.on('disconnect', () => relay('disconnect', null));
        this.#process.on('kill', (code) => relay('kill', code));
        this.#process.on('error', (error) => relay('error', { error }));

        try {
            const result = await new Promise<WorkerPayload<TContract, 'ready'>>((resolve, reject) => {
                this.once('ready', (data, _reply, _id) => resolve(data));
                this.once('exit', (data, _reply, _id) => reject(new Error(`Child process has exited with code ${data.code}: ${data.signal}`)));
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

    public kill(code: NodeJS.Signals | number = 'SIGTERM'): void {
        if (this.#process === undefined || !this.#process.connected)
            throw new Error('The child process is not connected');

        this.logger.worker(`Killing ${this.worker} worker (ID: ${this.id})`);
        this.#process.kill(code);
    }

    public emit(): never {
        throw new Error('Emitting custom events isnt allowed on this object');
    }

    private emitCore<T extends ContractKey<TContract>>(type: T, id: Snowflake, data: WorkerPayload<TContract, T>): boolean {
        const reply = (message: MasterPayload<TContract, T>): boolean => this.send(type, id, message);
        return super.emit(type, data, reply, id);
    }

    public send<T extends ContractKey<TContract>>(type: T, id: Snowflake, data: MasterPayload<TContract, T>): boolean {
        if (this.#process === undefined)
            throw new Error('Child process has not been started yet');
        return this.#process.send(<MasterMessage<TContract, T>>{ type, id, data });
    }

    public request<T extends ContractKey<TContract>>(type: T, data: MasterPayload<TContract, T>, timeoutMS = 10000): Promise<WorkerPayload<TContract, T>> {
        const requestId = snowflake.create();
        return new Promise<WorkerPayload<TContract, T>>((resolve, reject) => {
            const handler: WorkerMessageHandler<TContract, T> = (data, _, id) => {
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