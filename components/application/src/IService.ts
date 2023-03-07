import type { RequestListener } from 'node:http';
import { Server } from 'node:http';

export interface IService {
    start(signal: AbortSignal): Awaitable<void>;
    stop(signal: AbortSignal): Awaitable<void>;
}

export function connectionToService(connection: ConnectionManager, name: string): IService {
    return {
        async start(signal) {
            await connection.connect(signal);
            console.log(`${name} connected`);
        },
        async stop(signal) {
            await connection.disconnect(signal);
            console.log(`${name} disconnected`);
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
