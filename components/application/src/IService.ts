import type { RequestListener } from 'node:http';
import { Server } from 'node:http';

export interface IService {
    start(signal: AbortSignal): Awaitable<void>;
    stop(signal: AbortSignal): Awaitable<void>;
}

export function seriesServices(...services: IService[]): IService {
    let state = 0;
    return {
        async start(abortSignal) {
            while (state < services.length) {
                await services[state].start(abortSignal);
                state++;
                if (abortSignal.aborted)
                    throw new Error('Abort requested during application startup');
            }
        },
        async stop(abortSignal) {
            while (--state >= 0) {
                try {
                    await services[state].stop(abortSignal);
                } catch (err) {
                    console.error('Error while stopping application', err);
                }
                if (abortSignal.aborted)
                    throw new Error('Abort requested during application shutdown');
            }
        }
    };
}

export function parallelServices(...services: IService[]): IService {
    const started = new Map<IService, Promise<void>>();
    async function startAsync(service: IService, signal: AbortSignal): Promise<void> {
        try {
            return await service.start(signal);
        } catch (err) {
            started.delete(service);
            throw err;
        }
    }
    async function stopAsync(service: IService, signal: AbortSignal): Promise<void> {
        try {
            return await service.stop(signal);
        } finally {
            started.delete(service);
        }
    }
    return {
        async start(signal) {
            for (const service of services) {
                if (!started.has(service))
                    started.set(service, startAsync(service, signal));
            }
            await Promise.all(started.values());
        },
        async stop(signal) {
            await Promise.all(
                [...started.keys()]
                    .map(s => stopAsync(s, signal))
            );
        }
    };
}

export function connectToService(factory: (signal: AbortSignal) => Awaitable<Connection>, name: string): IService
export function connectToService(service: ConnectionManager, name: string): IService
export function connectToService(factory: ConnectionManager | ((signal: AbortSignal) => Awaitable<Connection>), name: string): IService {
    const manager = typeof factory === 'function' ? connectionFactoryToManager(factory, name) : factory;
    return {
        async start(signal) {
            await manager.connect(signal);
            console.log(`${name} connected`);
        },
        async stop(signal) {
            await manager.disconnect(signal);
            console.log(`${name} disconnected`);
        }
    };
}

function connectionFactoryToManager(factory: (signal: AbortSignal) => Awaitable<Connection>, name: string): ConnectionManager {
    let connected = false;
    let connection: Connection | undefined;
    return {
        async connect(signal) {
            if (connected)
                throw new Error(`${name} already connected`);
            connected = true;
            connection = await factory(signal);
        },
        async disconnect(signal) {
            if (!connected)
                return;
            await connection?.disconnect(signal);
            connected = false;
            connection = undefined;
        }
    };
}

export function webService(app: Pick<Server, 'listen' | 'close'> | RequestListener, port: number): IService {
    const server = typeof app === 'function' ? new Server(app) : app;
    return {
        async start() {
            await new Promise<void>(res => server.listen(port, res));
            console.log(`Server listening on port ${port}`);
        },
        async stop() {
            await new Promise<void>(res => server.close(() => res));
            console.log(`Server stopped on port ${port}`);
        }
    };
}

interface ConnectionManager {
    connect(signal: AbortSignal): Awaitable<void>;
    disconnect(signal: AbortSignal): Awaitable<void>;
}

interface Connection {
    disconnect(signal: AbortSignal): Awaitable<void>;
}
