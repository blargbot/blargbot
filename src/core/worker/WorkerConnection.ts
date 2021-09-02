import { Logger } from '@core/Logger';
import { Timer } from '@core/Timer';
import { snowflake } from '@core/utils';
import child_process, { ChildProcess } from 'child_process';
import moment from 'moment';
import { Moment } from 'moment-timezone';

import { IPCEvents } from './IPCEvents';

export const enum WorkerState {
    READY,
    RUNNING,
    KILLED,
    EXITED
}

export abstract class WorkerConnection<T extends string> extends IPCEvents {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #process?: ChildProcess;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #killed: boolean;

    public get state(): WorkerState {
        if (this.#process === undefined)
            return WorkerState.READY;
        if (this.#process.connected)
            return WorkerState.RUNNING;
        if (this.#killed)
            return WorkerState.KILLED;
        return WorkerState.EXITED;
    }

    public readonly args: string[];
    public readonly env: NodeJS.ProcessEnv;
    public readonly created: Moment;
    public readonly file: string;

    protected constructor(
        public readonly id: number,
        public readonly worker: T,
        public readonly logger: Logger
    ) {
        super();
        this.created = moment();
        this.args = [...process.execArgv];
        // eslint-disable-next-line @typescript-eslint/naming-convention
        this.env = { ...process.env, WORKER_ID: id.toString() };
        this.file = require.resolve(`@workers/${this.worker}`);
        this.#killed = false;
        this.on('alive', () => this.logger.worker(`${this.worker} worker (ID: ${this.id}) is alive`));
        this.on('error', err => this.logger.error(`${this.worker} worker (ID: ${this.id}) error: `, err));
    }

    public async connect(timeoutMs: number): Promise<unknown> {
        if (this.#process !== undefined)
            throw new Error('Cannot connect to a worker multiple times. Create a new instance for a new worker');

        Object.freeze(this.args);
        Object.freeze(this.env);

        this.logger.worker(`Spawning a new ${this.worker} worker (ID: ${this.id})`);
        const timer = new Timer();
        timer.start();

        const process = this.#process = child_process.fork(this.file, {
            env: this.env,
            execArgv: this.args
        });

        if (process.pid === undefined)
            throw new Error(`Failed to start ${this.worker} worker (ID: ${this.id})`);

        super.attach(process);

        const relay = (code: string, data?: unknown): void => {
            this.logger.worker(`${this.worker} worker (ID: ${this.id} PID: ${process.pid ?? 'NOT RUNNING'}) sent ${code}`);
            this.emit(code, data, snowflake.create());
        };
        process.on('exit', (code, signal) => relay('exit', { code, signal }));
        process.on('close', (code, signal) => relay('close', { code, signal }));
        process.on('disconnect', () => relay('disconnect'));
        process.on('kill', code => relay('kill', code));
        process.on('error', error => relay('error', error));

        try {
            const result = await new Promise<unknown>((resolve, reject) => {
                this.once('ready', data => resolve(data));
                this.once('exit', data => reject(new Error(`Child process has exited with ${JSON.stringify(data)}`)));
                setTimeout(() => reject(new Error('Child process failed to send ready in time')), timeoutMs);
            });
            timer.end();
            this.logger.worker(`${this.worker} worker (ID: ${this.id} PID: ${process.pid}) is ready after ${timer.elapsed}ms and said ${JSON.stringify(result)}`);
            return result;
        } catch (err: unknown) {
            this.#process.kill();
            this.logger.error(`${this.worker} worker (ID: ${this.id} PID: ${process.pid}) failed to start`, err);
            throw err;
        }
    }

    public async kill(code: NodeJS.Signals | number = 'SIGTERM'): Promise<void> {
        if (this.#process === undefined || !this.#process.connected)
            throw new Error('The child process is not connected');

        this.logger.worker(`Killing ${this.worker} worker (ID: ${this.id} PID: ${this.#process.pid ?? 'NOT RUNNING'})`);

        try {
            await this.request('stop', undefined);
        } catch { /* NOOP */ }

        if (<boolean>this.#process.connected)
            this.#process.kill(code);

        this.#killed = true;
    }
}
