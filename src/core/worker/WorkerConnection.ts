import { Logger } from '@blargbot/core/Logger';
import { Timer } from '@blargbot/core/Timer';
import { GetMasterProcessMessageHandler, IPCContractMasterGets, IPCContractNames, IPCContracts, IPCContractWorkerGets } from '@blargbot/core/types';
import child_process from 'child_process';
import moment, { Moment } from 'moment-timezone';

import { IPCMessageEmitter } from './IPCMessageEmitter';

export const enum WorkerState {
    READY,
    RUNNING,
    KILLED,
    EXITED
}

export abstract class WorkerConnection<T extends string, Contracts extends IPCContracts> {
    #killed: boolean;

    public get state(): WorkerState {
        if (this.ipc.process === undefined)
            return WorkerState.READY;
        if (this.ipc.process.connected)
            return WorkerState.RUNNING;
        if (this.#killed)
            return WorkerState.KILLED;
        return WorkerState.EXITED;
    }

    protected readonly ipc: IPCMessageEmitter;
    public readonly args: string[];
    public readonly env: NodeJS.ProcessEnv;
    public readonly created: Moment;
    public readonly file: string;

    protected constructor(
        public readonly id: number,
        public readonly worker: T,
        public readonly logger: Logger
    ) {
        this.ipc = new IPCMessageEmitter();
        this.created = moment();
        this.args = [...process.execArgv];
        // eslint-disable-next-line @typescript-eslint/naming-convention
        this.env = { ...process.env, WORKER_ID: id.toString() };
        this.file = require.resolve(this.worker);
        this.#killed = false;

        this.on('alive', () => this.logger.worker(this.worker, 'worker ( ID:', this.id, ') is alive'));
        this.on('error', err => this.logger.error(this.worker, 'worker ( ID:', this.id, ') error:', err));
    }

    public async connect(timeoutMs: number): Promise<unknown> {
        if (this.ipc.process !== undefined)
            throw new Error('Cannot connect to a worker multiple times. Create a new instance for a new worker');

        Object.freeze(this.args);
        Object.freeze(this.env);

        this.logger.worker('Spawning a new', this.worker, 'worker ( ID:', this.id, ')');
        const timer = new Timer();
        timer.start();

        const process = this.ipc.process = child_process.fork(this.file, {
            env: this.env,
            execArgv: this.args
        });

        if (process.pid === undefined)
            throw new Error(`Failed to start ${this.worker} worker (ID: ${this.id})`);

        for (const code of ['exit', 'close', 'disconnect', 'kill', 'error'] as const)
            process.on(code, data => this.logger.worker(this.worker, 'worker ( ID:', this.id, 'PID:', process.pid ?? 'NOT RUNNING', ') sent', code, data));

        try {
            const result = await new Promise<unknown>((resolve, reject) => {
                this.once('ready', ctx => resolve(ctx.data));
                this.once('exit', ctx => reject(new Error(`Child process has exited with ${JSON.stringify(ctx.data)}`)));
                setTimeout(() => reject(new Error('Child process failed to send ready in time')), timeoutMs);
            });
            timer.end();
            this.logger.worker(this.worker, 'worker ( ID:', this.id, 'PID:', process.pid, ') is ready after', timer.elapsed, 'ms and said:\n', result);
            return result;
        } catch (err: unknown) {
            this.ipc.process.kill();
            this.logger.error(this.worker, 'worker ( ID:', this.id, 'PID:', process.pid, ') failed to start', err);
            throw err;
        }
    }

    public async kill(code: NodeJS.Signals | number = 'SIGTERM'): Promise<void> {
        if (this.ipc.process === undefined || !this.ipc.process.connected)
            throw new Error('The child process is not connected');

        this.logger.worker('Killing', this.worker, 'worker ( ID:', this.id, 'PID:', this.ipc.process.pid ?? 'NOT RUNNING');

        try {
            await this.ipc.request('stop', undefined);
        } catch { /* NOOP */ }

        if (<boolean>this.ipc.process.connected)
            this.ipc.process.kill(code);

        this.#killed = true;
    }

    public on<Event extends IPCContractNames<Contracts>>(event: Event, handler: GetMasterProcessMessageHandler<Contracts, Event>): this {
        this.ipc.on(event, handler);
        return this;
    }

    public once<Event extends IPCContractNames<Contracts>>(event: Event, handler: GetMasterProcessMessageHandler<Contracts, Event>): this {
        this.ipc.once(event, handler);
        return this;
    }

    public off<Event extends IPCContractNames<Contracts>>(event: Event, handler: GetMasterProcessMessageHandler<Contracts, Event>): this {
        this.ipc.off(event, handler);
        return this;
    }

    public send<Event extends IPCContractNames<Contracts>>(event: Event, data: IPCContractWorkerGets<Contracts, Event>): this {
        this.ipc.send(event, data);
        return this;
    }

    public async request<Event extends IPCContractNames<Contracts>>(event: Event, data: IPCContractWorkerGets<Contracts, Event>, timeoutMS?: number): Promise<IPCContractMasterGets<Contracts, Event>> {
        return await this.ipc.request(event, data, timeoutMS);
    }
}
