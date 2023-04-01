import type { IHost } from './IHost.js';

const hosts = new Set<IHost>();
let blockingHosts = 0;

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

export function host(app: IHost, options?: HostingOptions): void {
    void hostAsync(app, options);
}

async function hostAsync(app: IHost, options?: HostingOptions): Promise<void> {
    const { keepAlive = true, shutdownOn = ['SIGTERM'] } = options ?? {};
    hosts.add(app);
    for (const trigger of shutdownOn)
        process.once(trigger, shutdownIfRunning.bind(null, app));
    let exitCode = 0;
    try {
        if (keepAlive)
            blockingHosts++;
        await app.run();
    } catch (err) {
        console.error('Error while running host', err);
        exitCode = -1;
    }
    if (keepAlive && --blockingHosts === 0)
        process.exit(exitCode);
}

function shutdownIfRunning(host: IHost): void {
    switch (host.state) {
        case 'running':
        case 'starting':
            host.shutdown().catch(err => console.error('Error when requesting host shutdown', err));
    }
}

export interface HostingOptions {
    readonly keepAlive?: boolean;
    readonly shutdownOn?: ReadonlyArray<NodeJS.Signals | 'uncaughtException' | 'unhandledRejection'>;
}
