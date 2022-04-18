import { Api } from '@blargbot/api/Api';
import { Request, Response, Router } from 'express';
import asyncRouter from 'express-promise-router';
import { RouteParameters } from 'express-serve-static-core';
import { IncomingMessage } from 'http';
import { WebSocketServer } from 'ws';

import Security from './Security';
import { ApiResponse, AsyncRequestHandler, RequestHandlers } from './types';

export type AsyncRequestMiddleware<Route extends string, This> = (this: This, req: Request<RouteParameters<Route>>, res: Response, next: () => Awaitable<ApiResponse>) => Awaitable<ApiResponse>;

export class BaseRoute {
    readonly #routerBuildSteps: Array<(api: Api, router: Router) => void>;
    public readonly paths: ReadonlyArray<`/${string}`>;
    protected readonly middleware: Array<AsyncRequestMiddleware<string, this>>;
    readonly #websockets: Map<`/${string}`, Array<(socket: WebSocket, request: IncomingMessage) => void>>;

    public constructor(...paths: Array<`/${string}`>) {
        this.paths = paths;
        this.#routerBuildSteps = [];
        this.middleware = [];
        this.#websockets = new Map();
    }

    public install(api: Api): void {
        for (const path of this.paths)
            this.installAt(api, path);
    }

    protected installAt(api: Api, path: `/${string}`): void {
        const router = asyncRouter();
        for (const step of this.#routerBuildSteps)
            step(api, router);

        api.app.use(path, router);

        for (const [route, handlers] of this.#websockets.entries()) {
            const wss = new WebSocketServer({
                noServer: true,
                path: `${path}${route}`.replace(/\/$/, '')
            });

            api.server.on('upgrade', (req, sock, head) =>
                wss.handleUpgrade(req, sock, head, (ws, req) =>
                    wss.emit('connection', ws, req)));

            for (const handler of handlers)
                wss.on('connection', handler);
        }
    }

    protected addWebsocket<Route extends `/${string}`>(route: Route, handler: (this: this, socket: WebSocket, request: IncomingMessage) => void): this {
        let handlers = this.#websockets.get(route.toLowerCase());
        if (handlers === undefined)
            this.#websockets.set(route.toLowerCase(), handlers = []);
        handlers.push(handler.bind(this));
        return this;
    }

    protected addRoute<Route extends `/${string}`>(route: Route, handlers: RequestHandlers<Route>, ...middleware: Array<AsyncRequestMiddleware<Route, this>>): this {
        this.#routerBuildSteps.push((api, coreRouter) => {
            const router = coreRouter.route(route);
            const callMiddleware = (
                middleware: Array<AsyncRequestMiddleware<Route, this>>,
                req: Request<RouteParameters<Route>>,
                res: Response,
                handler: AsyncRequestHandler<Route>,
                index: number
            ): Awaitable<ApiResponse> => {
                if (index >= middleware.length)
                    return handler(req, res);
                return middleware[index].call(this, req, res, () => callMiddleware(middleware, req, res, handler, index + 1));
            };

            for (const [method, handler] of Object.entries(handlers)) {
                if (handler === undefined)
                    continue;
                router[method](async (req, res) => {
                    try {
                        const result = await callMiddleware(
                            [...this.middleware, ...middleware] as Array<AsyncRequestMiddleware<Route, this>>,
                            req,
                            res,
                            handler,
                            0
                        );
                        await result.execute(res);
                    } catch (err: unknown) {
                        if (err instanceof UnauthenticatedError) {
                            await this.unauthorized().execute(res);
                            return;
                        }
                        api.logger.error('Error while handling', req.originalUrl, err);
                        await this.internalServerError(err).execute(res);
                    }
                });
            }
        });
        return this;
    }

    protected getUserId(request: Request): string;
    protected getUserId(request: Request, allowUndef: boolean): string | undefined;
    protected getUserId(request: Request, allowUndef = false): string | undefined {
        const token = request.header('Authorization');
        if (token === undefined)
            return undefined;
        const id = Security.validateToken(token);
        if (id !== null)
            return id;
        if (allowUndef)
            return undefined;
        throw new UnauthenticatedError();
    }

    protected status(status: number, body?: unknown): ApiResponse {
        return {
            execute(res) {
                res.status(status)
                    .send(body);
            }
        };
    }

    protected notFound<T>(body?: Awaited<T>): ApiResponse {
        return this.status(404, body);
    }

    protected badRequest<T>(body?: Awaited<T>): ApiResponse {
        return this.status(400, body);
    }

    protected ok<T>(body: Awaited<Exclude<T, undefined>>): ApiResponse {
        return this.status(200, body);
    }

    protected created<T>(body: Awaited<T>): ApiResponse {
        return this.status(200, body);
    }

    protected noContent(): ApiResponse {
        return this.status(204);
    }

    protected unauthorized<T>(body?: Awaited<T>): ApiResponse {
        return this.status(401, body);
    }

    protected forbidden<T>(body?: Awaited<T>): ApiResponse {
        return this.status(403, body);
    }

    protected internalServerError<T>(body?: Awaited<T>): ApiResponse {
        return this.status(500, body);
    }
}

class UnauthenticatedError extends Error {

}
