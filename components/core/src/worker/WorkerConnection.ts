import { Timer } from '@blargbot/core/Timer.js';
import { GetMasterProcessMessageHandler, IPCContractMasterGets, IPCContractNames, IPCContracts, IPCContractWorkerGets } from '@blargbot/core/types.js';
import { Logger } from '@blargbot/logger';
import child_process from 'child_process';
import moment from 'moment-timezone';
import { createInterface } from 'readline';
import streams from 'stream';

import { IPCMessageEmitter } from './IPCMessageEmitter.js';

export const enum WorkerState {
    READY,
    RUNNING,
    KILLED,
    EXITED
}

export abstract class WorkerConnection<Contracts extends IPCContracts> {
    #killed: boolean;
    #logs: string[] = [];
    readonly #ipc: IPCMessageEmitter;
    readonly #stdout = new streams.PassThrough();
    readonly #stderr = new streams.PassThrough();
    readonly #stdin = new streams.PassThrough();

    public get state(): WorkerState {
        if (this.#ipc.process === undefined)
            return WorkerState.READY;
        if (this.#ipc.process.connected)
            return WorkerState.RUNNING;
        if (this.#killed)
            return WorkerState.KILLED;
        return WorkerState.EXITED;
    }

    public readonly args: string[];
    public readonly env: NodeJS.ProcessEnv;
    public readonly created: moment.Moment;
    public get logs(): readonly string[] { return [...this.#logs].reverse(); }
    public get stdout(): streams.Readable { return this.#stdout; }
    public get stderr(): streams.Readable { return this.#stderr; }
    public get stdin(): streams.Writable { return this.#stdin; }

    protected constructor(
        public readonly id: number,
        public readonly worker: string,
        public readonly entrypoint: string,
        public readonly logger: Logger
    ) {
        this.#ipc = new IPCMessageEmitter();
        this.created = moment();
        this.args = [...process.execArgv];
        // eslint-disable-next-line @typescript-eslint/naming-convention
        this.env = { ...process.env, WORKER_ID: id.toString() };
        this.env.FORCE_COLOR = '1';

        this.#killed = false;

        this.on('alive', () => this.logger.worker(this.worker, 'worker ( ID:', this.id, ') is alive'));
        this.on('error', err => this.logger.error(this.worker, 'worker ( ID:', this.id, ') error:', err));

        this.#stderr.pipe(process.stderr);
        this.#stdout.pipe(process.stdout);

        const logStream = new streams.PassThrough();
        this.#stdout.pipe(logStream);
        this.#stderr.pipe(logStream);
        createInterface({
            input: logStream,
            terminal: true,
            historySize: 100
        }).on('history', lines => this.#logs = lines);
    }

    public async connect(timeoutMs: number): Promise<unknown> {
        if (this.#ipc.process !== undefined)
            throw new Error('Cannot connect to a worker multiple times. Create a new instance for a new worker');

        Object.freeze(this.args);
        Object.freeze(this.env);

        this.logger.worker('Spawning a new', this.worker, 'worker ( ID:', this.id, ')');
        const timer = new Timer();
        timer.start();

        const process = this.#ipc.process = child_process.fork(this.entrypoint, {
            env: this.env,
            execArgv: this.args,
            stdio: 'pipe'
        });

        if (process.pid === undefined)
            throw new Error(`Failed to start ${this.worker} worker (ID: ${this.id})`);

        process.stderr?.pipe(this.#stderr);
        process.stdout?.pipe(this.#stdout);
        if (process.stdin !== null)
            this.#stdin.pipe(process.stdin);

        for (const code of ['exit', 'close', 'disconnect', 'kill', 'error'] as const)
            process.on(code, data => this.logger.worker(this.worker, 'worker ( ID:', this.id, 'PID:', process.pid ?? '???', ') sent', code, data));

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
            this.#ipc.process.kill();
            this.logger.error(this.worker, 'worker ( ID:', this.id, 'PID:', process.pid, ') failed to start', err);
            throw err;
        }
    }

    public async kill(code: NodeJS.Signals | number = 'SIGTERM'): Promise<void> {
        if (this.#ipc.process !== undefined) {
            this.logger.worker('Killing', this.worker, 'worker ( ID:', this.id, 'PID:', this.#ipc.process.pid ?? 'NOT RUNNING');

            try {
                await this.#ipc.request('stop', undefined);
            } catch { /* NOOP */ }

            try {
                this.#ipc.process.kill(code);
            } catch { /* NOOP */ }
        }
        this.#killed = true;
    }

    public on<Event extends IPCContractNames<Contracts>>(event: Event, handler: GetMasterProcessMessageHandler<Contracts, Event>): this {
        this.#ipc.on(event, handler);
        return this;
    }

    public once<Event extends IPCContractNames<Contracts>>(event: Event, handler: GetMasterProcessMessageHandler<Contracts, Event>): this {
        this.#ipc.once(event, handler);
        return this;
    }

    public off<Event extends IPCContractNames<Contracts>>(event: Event, handler: GetMasterProcessMessageHandler<Contracts, Event>): this {
        this.#ipc.off(event, handler);
        return this;
    }

    public send<Event extends IPCContractNames<Contracts>>(event: Event, data: IPCContractWorkerGets<Contracts, Event>): this {
        this.#ipc.send(event, data);
        return this;
    }

    public async request<Event extends IPCContractNames<Contracts>>(event: Event, data: IPCContractWorkerGets<Contracts, Event>, timeoutMS?: number): Promise<IPCContractMasterGets<Contracts, Event>> {
        return await this.#ipc.request(event, data, timeoutMS);
    }
}
