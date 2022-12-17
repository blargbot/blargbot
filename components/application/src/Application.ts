import { AsyncLocalStorage } from 'async_hooks';

import type { ApplicationOptions } from './ApplicationOptions.js';
import getCallerImportMeta from './getCallerImportMeta.js';
import isEntrypoint from './isEntrypoint.js';

export default abstract class Application {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static get Script(): typeof Script {
        return Script;
    }

    static readonly #current = new AsyncLocalStorage<Application>();
    static readonly #running = new Set<Application>();

    public static get current(): Application {
        const app = this.#current.getStore();
        if (app === undefined)
            throw new Error('No current application is available');
        return app;
    }

    public static hostIfEntrypoint<App extends new () => Application>(): (target: App) => void
    public static hostIfEntrypoint<Args extends readonly unknown[], App extends new (...args: Args) => Application>(options: () => Args): (target: App) => void
    public static hostIfEntrypoint(options?: () => unknown[]): (target: new (...args: unknown[]) => Application) => void {
        return isEntrypoint(getCallerImportMeta())
            ? this.host(...options?.() ?? [])
            : target => target;
    }

    public static host<Args extends readonly unknown[], App extends new (...args: Args) => Application>(...options: Args): (target: App) => void {
        return ctor => {
            const application = new ctor(...options);
            setImmediate(() => void application.run());
            return ctor;
        };
    }

    #requestShutdown: () => void;
    readonly #lifecycle: ApplicationOptions;
    readonly #shutdownRequested: Promise<void>;

    get #startAbort(): AbortSignal {
        return getAbortSignal(this.#lifecycle.startTime);
    }

    get #stopAbort(): AbortSignal {
        return getAbortSignal(this.#lifecycle.stopTime);
    }

    public constructor(options: ApplicationOptions = {}) {
        this.#lifecycle = options;
        this.#requestShutdown = () => undefined;
        this.#shutdownRequested = new Promise(res => {
            this.#requestShutdown = res;
            for (const signal of options.shutdownOn ?? ['SIGTERM'])
                process.once(signal, res);
        });
    }

    protected abstract start(signal: AbortSignal): Awaitable<void>;
    protected abstract stop(signal: AbortSignal): Awaitable<void>;

    protected handleException(error: unknown, origin: NodeJS.UncaughtExceptionOrigin): boolean {
        console.log(origin, error);
        return true;
    }

    public async run(): Promise<boolean> {
        return await Application.#current.run(this, async () => {
            Application.#running.add(this);

            console.log('Starting application', this.constructor.name);
            let success = true;
            if (await this.#tryRun('start', this.#startAbort)) {
                console.log('Started application', this.constructor.name);
                await this.#shutdownRequested;
            } else {
                success = false;
            }

            console.log('Stopping application', this.constructor.name);
            if (await this.#tryRun('stop', this.#stopAbort)) {
                console.log('Stopped application', this.constructor.name);
            } else {
                success = false;
            }
            Application.#running.delete(this);
            return success;
        });
    }

    public requestShutdown(): void {
        this.#requestShutdown();
    }

    async #tryRun(action: 'start' | 'stop', signal: AbortSignal): Promise<boolean> {
        try {
            await this[action](signal);
            return true;
        } catch (err) {
            console.error(`Error while calling application ${action}:`, err);
            return false;
        }
    }
}

abstract class Script extends Application {
    readonly #abort: AbortController;
    #result?: Awaitable<void>;

    protected constructor(options: ApplicationOptions = {}) {
        super(options);
        this.#abort = new AbortController();
    }

    protected abstract main(signal: AbortSignal): Awaitable<void>;

    protected override async start(): Promise<void> {
        this.#result = this.main(this.#abort.signal);
        await this.#result;
    }

    protected override async stop(): Promise<void> {
        this.#abort.abort();
        await this.#result;
    }
}

function getAbortSignal(signal?: number | AbortSignal): AbortSignal {
    if (signal instanceof AbortSignal)
        return signal;
    if (signal === undefined)
        return new AbortController().signal;
    return createTimedAbort(signal);
}

function createTimedAbort(timeout: number): AbortSignal {
    const controller = new AbortController();
    const id = setTimeout(controller.abort.bind(controller), timeout);
    function handleAbort(): void {
        controller.signal.removeEventListener('abort', handleAbort);
        clearTimeout(id);
    }
    controller.signal.addEventListener('abort', handleAbort);
    return controller.signal;
}
