import type { HostState, IHost } from './IHost.js';
import type { IService } from './IService.js';

export class ServiceHost implements IHost {
    readonly #options: Required<HostingApplicationOptions>;
    readonly #services: readonly IService[];
    #state: number;
    #stateName: HostState;
    #shutdown?: () => Promise<void>;

    public get state(): HostState {
        return this.#stateName;
    }

    public constructor(services: Iterable<IService>, options?: HostingApplicationOptions) {
        this.#options = {
            ...defaultOptions,
            ...options
        };
        this.#services = [...services];
        this.#state = -1;
        this.#stateName = 'stopped';
    }

    public async run(): Promise<void> {
        if (this.#state !== -1)
            throw new Error('Application is already running!');

        this.#state++;

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
        this.#state = -1;
        startAbort.abort();
        signalStopped();

    }

    async #start(abortSignal: AbortSignal): Promise<boolean> {
        try {
            while (this.#state < this.#services.length) {
                await this.#services[this.#state].start(abortSignal);
                this.#state++;
                if (abortSignal.aborted)
                    throw new Error('Abort requested during application startup');
            }
            return true;
        } catch (err) {
            console.error('Error while starting application', err);
            return false;
        }
    }

    async #stop(abortSignal: AbortSignal): Promise<boolean> {
        try {
            while (--this.#state >= 0) {
                try {
                    await this.#services[this.#state].stop(abortSignal);
                } catch (err) {
                    console.error('Error while stopping application', err);
                }
                if (abortSignal.aborted)
                    throw new Error('Abort requested during application shutdown');
            }
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
