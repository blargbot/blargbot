import { IncomingMessage } from 'node:http';

import { Api } from '@blargbot/api/Api.js';
import { Lazy } from '@blargbot/core/Lazy.js';
import asyncRouter from 'express-promise-router';
import { IRoute } from 'express-serve-static-core';
import { WebSocketServer } from 'ws';

import Security from './Security.js';
import { ApiResponse, AsyncRequestContext, AsyncRequestHandler, AsyncRequestMiddleware, AsyncWebsocketHandler, RequestHandlers, RequestMethods } from './types.js';

export class BaseRoute {
    readonly #installSteps: Array<(api: Api, path: string) => void>;
    public readonly paths: ReadonlyArray<`/${string}`>;
    protected readonly middleware: Array<AsyncRequestMiddleware<this, string>>;
    public constructor(...paths: Array<`/${string}`>) {
        this.paths = paths;
        this.#installSteps = [];
        this.middleware = [];
    }

    public install(api: Api): void {
        for (const path of this.paths)
            this.installAt(api, path);
    }

    protected installAt(api: Api, path: `/${string}`): void {
        for (const step of this.#installSteps)
            step(api, path);
    }

    #bindWebsocket(api: Api, path: string, handler: AsyncWebsocketHandler<this>): void {
        const wss = new WebSocketServer({
            noServer: true,
            path: path.replace(/\/$/, '')
        });

        api.server.on('upgrade', (req, sock, head) =>
            wss.handleUpgrade(req, sock, head, (ws, req) =>
                wss.emit('connection', ws, req)));

        wss.on('connection', (socket, request) => {
            void handler.call(this, { socket, request, api });
        });
    }

    #bindRoute<Route extends `/${string}`>(api: Api, router: IRoute<Route>, method: RequestMethods, middleware: Array<AsyncRequestMiddleware<this, Route>>, handler: AsyncRequestHandler<this, Route>): void {
        const getResult = createMiddlewareCaller<this, Route>(this, () => [...this.middleware, ...middleware], handler);
        router[method](voidResult(async (request, response) => {
            try {
                const result = await getResult({ request, response, api });
                await result.execute(response);
            } catch (err: unknown) {
                if (err instanceof UnauthenticatedError) {
                    await this.unauthorized().execute(response);
                    return;
                }
                api.logger.error('Error while handling', request.originalUrl, err);
                await this.internalServerError(err).execute(response);
            }
        }));
    }

    protected addRoute<Route extends `/${string}`>(route: Route, handlers: RequestHandlers<this, Route>, ...middleware: Array<AsyncRequestMiddleware<this, Route>>): this {
        this.#installSteps.push((api, baseRoute) => {
            const fullPath = baseRoute + route;
            const { ws, ...http } = handlers;

            if (ws !== undefined)
                this.#bindWebsocket(api, fullPath, ws);

            const router = new Lazy(() => {
                const router = asyncRouter();
                api.app.use(baseRoute, router);
                return router.route(route);
            });
            for (const [method, handler] of Object.entries(http)) {
                if (handler === undefined)
                    continue;
                this.#bindRoute(api, router.value, method, middleware, handler);
            }
        });
        return this;
    }

    protected getUserId(request: IncomingMessage): string;
    protected getUserId(request: IncomingMessage, allowUndef: boolean): string | undefined;
    protected getUserId(request: IncomingMessage, allowUndef = false): string | undefined {
        const token = request.headers.authorization;
        if (token === undefined)
            return undefined;
        const id = Security.validateToken(token);
        if (id !== null)
            return id;
        if (allowUndef)
            return undefined;
        throw new UnauthenticatedError();
    }

    protected status(status: number, body?: unknown, contentType?: string): ApiResponse {
        return {
            execute(res) {
                if (contentType !== undefined)
                    res.set('Content-Type', contentType);
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

    protected ok<T>(body: Awaited<Exclude<T, undefined>>, contentType?: string): ApiResponse {
        return this.status(200, body, contentType);
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

function createMiddlewareCaller<This, Route extends string>(
    thisArg: This,
    getMiddleware: () => ReadonlyArray<AsyncRequestMiddleware<This, string> | AsyncRequestMiddleware<This, Route>>,
    handler: AsyncRequestHandler<This, Route>
): (context: AsyncRequestContext<Route>) => Awaitable<ApiResponse> {
    const callMiddleware = (context: AsyncRequestContext<Route>, index: number, middleware: ReadonlyArray<AsyncRequestMiddleware<This, string> | AsyncRequestMiddleware<This, Route>>): Awaitable<ApiResponse> => {
        if (index >= middleware.length)
            return handler.call(thisArg, context);
        return middleware[index].call(thisArg, context.request, context.response, () => callMiddleware(context, index + 1, middleware));
    };
    return (context) => callMiddleware(context, 0, getMiddleware());
}

function voidResult<Args extends readonly unknown[]>(func: (...args: Args) => unknown): (...args: Args) => void {
    return (...args) => void func(...args);
}
