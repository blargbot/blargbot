import type { HostState, IHost } from './IHost.js';

export abstract class ScriptHost implements IHost {
    #state: HostState;
    #shutdown?: () => Promise<void>;

    public get state(): HostState {
        return this.#state;
    }

    public constructor() {
        this.#state = 'stopped';
    }

    public async run(): Promise<void> {
        if (this.#shutdown !== undefined)
            throw new Error('Application is already running!');

        const abort = new AbortController();
        let signalStopped: () => void = () => { /* NO-OP */ };
        const stopped = new Promise<void>(res => signalStopped = res);
        this.#shutdown = () => {
            abort.abort();
            return stopped;
        };

        this.#state = 'running';
        try {
            await this.main(abort.signal);
        } catch (err) {
            console.error('Error while running application', err);
        }
        this.#state = 'stopped';
        this.#shutdown = undefined;
        signalStopped();
    }

    protected abstract main(abort: AbortSignal): Promise<void>;

    public shutdown(): Promise<void> {
        if (this.#shutdown === undefined)
            throw new Error('Application is not running!');
        return this.#shutdown();
    }

}
