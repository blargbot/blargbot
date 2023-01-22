import { Api } from '@blargbot/api/Api';
import { Lazy } from '@blargbot/core/Lazy';
import { TypeMapping } from '@blargbot/mapping';
import { IRoute } from 'express-serve-static-core';
import { IncomingMessage } from 'http';
import { WebSocketServer } from 'ws';

import Security from './Security';
import { ApiResponse, AsyncRequestContext, AsyncRequestHandler, AsyncRequestMiddleware, AsyncWebsocketHandler, RequestHandlers, RequestMethods } from './types';

type JoinRoutes<BaseRoutes extends Array<`/${string}`>, Route extends `/${string}`>
    = BaseRoutes[number] extends `${infer R}/` ? `${R}${Route}` : `${BaseRoutes[number]}${Route}`;

export class BaseRoute<BaseRoutes extends Array<`/${string}`>> {
    readonly #installSteps: Array<(api: Api, path: BaseRoutes[number]) => void>;
    public readonly paths: ReadonlyArray<`/${string}`>;
    protected readonly middleware: Array<AsyncRequestMiddleware<this, BaseRoutes[number]>>;
    public constructor(...paths: BaseRoutes) {
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

    protected mapRequestValue<T>(value: unknown, mapping: TypeMapping<T>): T {
        const result = mapping(value);
        if (!result.valid)
            throw new ApiRequestError(this.badRequest());

        return result.value;
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

    #bindRoute<Route extends `/${string}`>(api: Api, router: IRoute<JoinRoutes<BaseRoutes, Route>>, method: RequestMethods, middleware: Array<AsyncRequestMiddleware<this, JoinRoutes<BaseRoutes, Route>>>, handler: AsyncRequestHandler<this, JoinRoutes<BaseRoutes, Route>>): void {
        const getResult = createMiddlewareCaller<this, BaseRoutes, Route>(this, () => [...this.middleware, ...middleware], handler);
        router[method](voidResult(async (request, response) => {
            try {
                const result = await getResult({ request, response, api });
                await result.execute(response);
            } catch (err: unknown) {
                if (err instanceof ApiRequestError) {
                    await err.response.execute(response);
                    return;
                }
                api.logger.error('Error while handling', request.originalUrl, err);
                await this.internalServerError(err).execute(response);
            }
        }));
    }

    protected addRoute<Route extends `/${string}`>(route: Route, handlers: RequestHandlers<this, JoinRoutes<BaseRoutes, Route>>, ...middleware: Array<AsyncRequestMiddleware<this, JoinRoutes<BaseRoutes, Route>>>): this {
        this.#installSteps.push((api, baseRoute) => {
            const fullPath = baseRoute + route as JoinRoutes<BaseRoutes, Route>;
            const { ws, ...http } = handlers;

            if (ws !== undefined)
                this.#bindWebsocket(api, fullPath, ws);

            const router = new Lazy(() => {
                return api.router.route(fullPath);
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
        throw new ApiRequestError(this.unauthorized());
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

class ApiRequestError extends Error {
    public readonly response: ApiResponse;

    public constructor(response: ApiResponse) {
        super();
        this.response = response;
    }
}

type RouteMiddleware<This, BaseRoutes extends Array<`/${string}`>, Route extends `/${string}`> = AsyncRequestMiddleware<This, BaseRoutes[number]> | AsyncRequestMiddleware<This, JoinRoutes<BaseRoutes, Route>>;
function createMiddlewareCaller<This, BaseRoutes extends Array<`/${string}`>, Route extends `/${string}`>(
    thisArg: This,
    getMiddleware: () => ReadonlyArray<RouteMiddleware<This, BaseRoutes, Route>>,
    handler: AsyncRequestHandler<This, JoinRoutes<BaseRoutes, Route>>
): (context: AsyncRequestContext<JoinRoutes<BaseRoutes, Route>>) => Awaitable<ApiResponse> {

    function callMiddleware<T extends string>(
        context: AsyncRequestContext<T>,
        index: number,
        middleware: ReadonlyArray<AsyncRequestMiddleware<This, T>>,
        handler: AsyncRequestHandler<This, T>
    ): Awaitable<ApiResponse> {
        if (index >= middleware.length)
            return handler.call(thisArg, context);
        return middleware[index].call(thisArg, context.request, context.response, () => callMiddleware(context, index + 1, middleware, handler));
    }

    return (context) => callMiddleware(context, 0, getMiddleware() as ReadonlyArray<AsyncRequestMiddleware<This, JoinRoutes<BaseRoutes, Route>>>, handler);
}

function voidResult<Args extends readonly unknown[]>(func: (...args: Args) => unknown): (...args: Args) => void {
    return (...args) => void func(...args);
}
