import type { HostState, IHost } from './IHost.js';
import type { IService } from './IService.js';
import { seriesServices } from './IService.js';

export class ServiceHost implements IHost {
    readonly #options: Required<HostingApplicationOptions>;
    readonly #service: IService;
    #running: boolean;
    #stateName: HostState;
    #shutdown?: () => Promise<void>;

    public get state(): HostState {
        return this.#stateName;
    }

    public constructor(services: Iterable<IService>, options?: HostingApplicationOptions) {
        this.#service = seriesServices(...services);
        this.#options = {
            ...defaultOptions,
            ...options
        };
        this.#running = false;
        this.#stateName = 'stopped';
    }

    public async run(): Promise<void> {
        if (this.#running)
            throw new Error('Application is already running!');

        this.#running = true;

        const startAbort = new AbortController();
        let signalStopped: () => void = () => { /* NO-OP */ };
        const stopped = new Promise<void>(res => signalStopped = res);
        const shutdownRequested = new Promise<void>(res => {
            this.#shutdown = () => {
                res();
                startAbort.abort();
                return stopped;
            };
        });

        if (this.#options.startTimeLimitMs !== null)
            setTimeout(() => startAbort.abort(), this.#options.startTimeLimitMs);
        this.#stateName = 'starting';
        if (await this.#start(startAbort.signal)) {
            this.#stateName = 'running';
            await shutdownRequested;
        }
        const stopAbort = new AbortController();
        if (this.#options.stopTimeLimitMs !== null)
            setTimeout(() => stopAbort.abort(), this.#options.stopTimeLimitMs);
        this.#stateName = 'stopping';
        await this.#stop(stopAbort.signal);

        this.#stateName = 'stopped';
        this.#shutdown = undefined;
        this.#running = false;
        startAbort.abort();
        signalStopped();

    }

    async #start(abortSignal: AbortSignal): Promise<boolean> {
        try {
            await this.#service.start(abortSignal);
            return true;
        } catch (err) {
            console.error('Error while starting application', err);
            return false;
        }
    }

    async #stop(abortSignal: AbortSignal): Promise<boolean> {
        try {
            await this.#service.stop(abortSignal);
            return true;
        } catch (err) {
            console.error('Error while stopping application', err);
            return false;
        }
    }

    public async shutdown(): Promise<void> {
        if (this.#shutdown === undefined)
            throw new Error('Application is not running!');
        await this.#shutdown();
    }
}

export interface HostingApplicationOptions {
    readonly startTimeLimitMs?: number | null;
    readonly stopTimeLimitMs?: number | null;
}

const defaultOptions: Required<HostingApplicationOptions> = {
    startTimeLimitMs: null,
    stopTimeLimitMs: null
};
