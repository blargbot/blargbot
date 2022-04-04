import { GetWorkerProcessMessageHandler, IPCContractMasterGets, IPCContractNames, IPCContracts, IPCContractWorkerGets, LogEntry } from '@blargbot/core/types';
import { Logger } from '@blargbot/logger';

import { IPCMessageEmitter } from './IPCMessageEmitter';

export abstract class BaseWorker<Contracts extends IPCContracts> {
    protected readonly ipc: IPCMessageEmitter;
    public get id(): number { return process.pid; }
    public get env(): NodeJS.ProcessEnv { return process.env; }
    public get memoryUsage(): NodeJS.MemoryUsage { return process.memoryUsage(); }

    public constructor(
        public readonly logger: Logger
    ) {
        this.ipc = new IPCMessageEmitter(process);

        process.on('exit', () => logger.fatal('Process is exiting', new Error().stack?.slice(5)));
        process.on('unhandledRejection', err => this.logger.error('Unhandled rejection', err));
        process.on('disconnect', () => {
            logger.fatal('The parent process has disconnected!');
            process.exit();
        });

        this.on('stop', async ({ reply }) => {
            logger.fatal(`Stop command received. PID ${this.id}`);
            await this.stop();
            reply(undefined);
            process.exit();
        });

        this.logger.addPostHook(log => {
            this.send('log', { text: log.text, level: log.level, timestamp: log.timestamp } as LogEntry);
            return null;
        });

        this.send('alive', new Date());
    }

    public start(): void {
        this.send('ready', `Hello from process ${this.id}!`);
    }

    public stop(): Promise<void> | void {
        // NOOP
    }

    public on<Event extends IPCContractNames<Contracts>>(event: Event, handler: GetWorkerProcessMessageHandler<Contracts, Event>): this {
        this.ipc.on(event, handler);
        return this;
    }

    public once<Event extends IPCContractNames<Contracts>>(event: Event, handler: GetWorkerProcessMessageHandler<Contracts, Event>): this {
        this.ipc.once(event, handler);
        return this;
    }

    public off<Event extends IPCContractNames<Contracts>>(event: Event, handler: GetWorkerProcessMessageHandler<Contracts, Event>): this {
        this.ipc.off(event, handler);
        return this;
    }

    public send<Event extends IPCContractNames<Contracts>>(event: Event, data: IPCContractMasterGets<Contracts, Event>): this {
        this.ipc.send(event, data);
        return this;
    }

    public async request<Event extends IPCContractNames<Contracts>>(event: Event, data: IPCContractMasterGets<Contracts, Event>, timeoutMS?: number): Promise<IPCContractWorkerGets<Contracts, Event>> {
        return await this.ipc.request(event, data, timeoutMS);
    }
}
