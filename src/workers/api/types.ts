import { Request, Response } from 'express';
import { NextFunction, RouteParameters } from 'express-serve-static-core';

import { ApiWorker } from './ApiWorker';

export interface ApiOptions {
    worker: ApiWorker;
}

export interface ApiResponse {
    execute(response: Response): Awaitable<void>;
}

export type RequestMethods = 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head'
export type AsyncRequestHandler<Route extends string> = (req: Request<RouteParameters<Route>>, res: Response, next: NextFunction,) => Promise<ApiResponse>;
export type RequestHandlers<Route extends string> = { [P in RequestMethods]?: AsyncRequestHandler<Route> }
