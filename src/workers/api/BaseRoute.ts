import { Request, Router } from 'express';
import asyncRouter from 'express-promise-router';
import { RequestHandler } from 'express-serve-static-core';

import { ApiResponse, RequestHandlers } from './types';

export class BaseRoute {
    private readonly router: Router;
    public readonly paths: ReadonlyArray<`/${string}`>;
    public readonly handle: RequestHandler = (...args) => this.router(...args);

    public constructor(...paths: Array<`/${string}`>) {
        this.paths = paths;
        this.router = asyncRouter();
    }

    protected addRoute<Route extends `/${string}`>(route: Route, handlers: RequestHandlers<Route>): this {
        const router = this.router.route(route);
        for (const [method, handler] of Object.entries(handlers)) {
            router[method](async (req, res, next) => {
                try {
                    const result = await handler?.(req, res, next);
                    await result?.execute(res);
                } catch (err: unknown) {
                    await this.internalServerError(err).execute(res);
                }
            });
        }
        return this;
    }

    protected getUserId(request: Request): string | undefined {
        return request.header('x-user-id');
    }

    protected status(status: number, body?: unknown): ApiResponse {
        return {
            execute(res) {
                res.status(status)
                    .send(body);
            }
        };
    }

    protected notFound(body?: unknown): ApiResponse {
        return this.status(404, body);
    }

    protected badRequest(body?: unknown): ApiResponse {
        return this.status(401, body);
    }

    protected ok(body: unknown): ApiResponse {
        return this.status(200, body);
    }

    protected created(record: unknown): ApiResponse {
        return this.status(200, record);
    }

    protected noContent(): ApiResponse {
        return this.status(204);
    }

    protected unauthorized(body?: unknown): ApiResponse {
        return this.status(401, body);
    }

    protected forbidden(body?: unknown): ApiResponse {
        return this.status(403, body);
    }

    protected internalServerError(body?: unknown): ApiResponse {
        return this.status(500, body);
    }
}
