import child_process, { ChildProcess } from 'child_process';
import { Timer } from '../../structures/Timer';
import { Moment } from 'moment-timezone';
import moment from 'moment';
import { IPCEvents } from './IPCEvents';
import { snowflake } from '../../newbu';

export abstract class WorkerConnection extends IPCEvents {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #process?: ChildProcess;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #killed: boolean;

    public get killed(): boolean { return this.#killed; }
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
        this.#killed = false;
        this.on('alive', () => this.logger.worker(`${this.worker} worker (ID: ${this.id}) is alive`));
    }

    public async connect(timeoutMS: number): Promise<unknown> {
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

        super.attach(this.#process);

        const relay = (code: string, data?: unknown): void => {
            this.logger.worker(`${this.worker} worker (ID: ${this.id}) sent ${code}`);
            this.emit(code, data, snowflake.create());
        };
        this.#process.on('exit', (code, signal) => relay('exit', { code, signal }));
        this.#process.on('close', (code, signal) => relay('close', { code, signal }));
        this.#process.on('disconnect', () => relay('disconnect'));
        this.#process.on('kill', code => relay('kill', code));
        this.#process.on('error', error => relay('error', error));

        try {
            const result = await new Promise<unknown>((resolve, reject) => {
                this.once('ready', data => resolve(data));
                this.once('exit', data => reject(new Error(`Child process has exited with code ${data.code}: ${data.signal}`)));
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

        this.#killed = true;
        this.logger.worker(`Killing ${this.worker} worker (ID: ${this.id})`);
        this.#process.kill(code);
    }
}