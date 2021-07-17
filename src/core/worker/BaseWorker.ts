import { Logger } from '@core/Logger';
import { LogEntry } from '../types';
import { IPCEvents } from './IPCEvents';

export abstract class BaseWorker extends IPCEvents {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #process: NodeJS.Process;
    public get id(): number { return this.#process.pid; }
    public get env(): NodeJS.ProcessEnv { return this.#process.env; }
    public get memoryUsage(): NodeJS.MemoryUsage { return this.#process.memoryUsage(); }

    public constructor(
        public readonly logger: Logger
    ) {
        super(process);

        this.#process = process;
        this.#process.on('unhandledRejection', (err) =>
            this.logger.error('Unhandled Promise Rejection: Promise', err));

        this.logger.addPostHook(({ text, level, timestamp }: LogEntry) => {
            this.send('log', { text, level, timestamp });
            return null;
        });

        this.send('alive');
    }

    public start(): void {
        this.send('ready', `Hello from process ${this.id}!`);
    }
}
