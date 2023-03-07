import getCallerImportMeta from './getCallerImportMeta.js';
import type { IHost } from './IHost.js';
import isEntrypoint from './isEntrypoint.js';

const hosts = new Set<IHost>();

export function getRunningHosts(): IHost[] {
    const result = [];
    for (const host of [...hosts]) {
        if (host.state !== 'stopped')
            result.push(host);
        else
            hosts.delete(host);
    }
    return result;
}

function hostCore(app?: IHost | (() => readonly unknown[]) | HostingOptions, options?: HostingOptions): void | (<T extends new (...args: readonly unknown[]) => IHost>(target: T) => T) {
    if (app === undefined) {
        return t => {
            setImmediate(() => hostApp(new t()));
            return t;
        };
    }

    if (typeof app === 'function') {
        const getArgs = app;
        return t => {
            setImmediate(() => hostApp(new t(...getArgs()), options));
            return t;
        };
    }

    if (!('run' in app && 'shutdown' in app))
        return t => {
            options = app;
            setImmediate(() => hostApp(new t(), options));
            return t;
        };

    hostApp(app, options);

}

function hostApp(app: IHost, options?: HostingOptions): void {
    hosts.add(app);
    for (const trigger of options?.shutdownOn ?? ['SIGTERM'])
        process.once(trigger, shutdownIfRunning.bind(null, app));
    app.run().catch(err => console.error('Error while running host', err));
}

export function host(options?: HostingOptions): <T extends new () => IHost>(target: T) => T
export function host(app: IHost, options?: HostingOptions): void
export function host<Args extends readonly unknown[]>(args: () => Args, options?: HostingOptions): <T extends new (...args: Args) => IHost>(target: T) => T
export function host(...args: Parameters<typeof hostCore>): ReturnType<typeof hostCore> {
    return hostCore(...args);
}

export function hostIfEntrypoint(options?: HostingOptions): <T extends new () => IHost>(target: T) => T
export function hostIfEntrypoint(app: IHost, options?: HostingOptions): void
export function hostIfEntrypoint<Args extends readonly unknown[]>(args: () => Args, options?: HostingOptions): <T extends new (...args: Args) => IHost>(target: T) => T
export function hostIfEntrypoint(...args: Parameters<typeof hostCore>): ReturnType<typeof hostCore> {
    if (isEntrypoint(getCallerImportMeta()))
        return hostCore(...args);
}

function shutdownIfRunning(host: IHost): void {
    switch (host.state) {
        case 'running':
        case 'starting':
            host.shutdown().catch(err => console.error('Error when requesting host shutdown', err));
    }
}

export interface HostingOptions {
    readonly shutdownOn?: ReadonlyArray<NodeJS.Signals | 'uncaughtException' | 'unhandledRejection'>;
}
