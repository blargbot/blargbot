import { Logger } from '@blargbot/core/Logger';
import { GetWorkerProcessMessageHandler, IPCContractMasterGets, IPCContractNames, IPCContracts, IPCContractWorkerGets, LogEntry } from '@blargbot/core/types';

import { IPCMessageEmitter } from './IPCMessageEmitter';

export abstract class BaseWorker<Contracts extends IPCContracts> {
    protected readonly ipc: IPCMessageEmitter;
    public get id(): number { return this.process.pid; }
    public get env(): NodeJS.ProcessEnv { return this.process.env; }
    public get memoryUsage(): NodeJS.MemoryUsage { return this.process.memoryUsage(); }

    public constructor(
        private readonly process: NodeJS.Process,
        public readonly logger: Logger
    ) {
        this.ipc = new IPCMessageEmitter(process);

        this.process.on('unhandledRejection', (err) =>
            this.logger.error('Unhandled Promise Rejection: Promise', err));

        this.on('stop', async ({ reply }) => {
            await this.stop();
            reply(undefined);
            this.process.exit();
        });

        this.logger.addPostHook(({ text, level, timestamp }: LogEntry) => {
            this.send('log', { text, level, timestamp });
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
