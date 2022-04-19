import { ClusterStats, CommandListResult, GuildPermissionDetails, ICommandDetails, SubtagDetails, SubtagListResult } from '@blargbot/cluster/types';
import { GuildSettingDocs } from '@blargbot/domain/models';
import { Request, Response } from 'express';
import { IRoute, IRouterHandler, RouteParameters } from 'express-serve-static-core';
import { IncomingMessage } from 'http';
import { WebSocket } from 'ws';

import { Api } from './Api';
import { ApiWorker } from './ApiWorker';

export type ApiIPCContracts = {
    'getSubtagList': { masterGets: undefined; workerGets: SubtagListResult; };
    'getSubtag': { masterGets: string; workerGets: SubtagDetails | undefined; };
    'getGuildPermissionList': { masterGets: { userId: string; }; workerGets: GuildPermissionDetails[]; };
    'getGuildPermission': { masterGets: { userId: string; guildId: string; }; workerGets: GuildPermissionDetails | undefined; };
    'getCommandList': { masterGets: undefined; workerGets: CommandListResult; };
    'getGuildSettings': { masterGets: undefined; workerGets: GuildSettingDocs; };
    'getCommand': { masterGets: string; workerGets: ICommandDetails | undefined; };
    'clusterStats': { masterGets: never; workerGets: Record<number, ClusterStats | undefined>; };
}

export interface ApiOptions {
    worker: ApiWorker;
}

export interface ApiResponse {
    execute(response: Response): Awaitable<void>;
}

export interface AsyncRequestContext<Route extends string> {
    readonly request: Request<RouteParameters<Route>>;
    readonly response: Response;
    readonly api: Api;
}
export interface AsyncWebsocketContext {
    readonly request: IncomingMessage;
    readonly socket: WebSocket;
    readonly api: Api;
}

type ExplicitlyExtends<T, U, True, False> = [T] extends [U] ? [unknown] extends [T] ? False : True : False;

export type RequestMethods = keyof { [P in keyof IRoute as ExplicitlyExtends<IRoute[P], IRouterHandler<unknown>, P, never>]: 0 }
export type AsyncRequestMiddleware<This, Route extends string> = (this: This, req: Request<RouteParameters<Route>>, res: Response, next: () => Awaitable<ApiResponse>) => Awaitable<ApiResponse>;
export type AsyncRequestHandler<This, Route extends string> = (this: This, ctx: AsyncRequestContext<Route>) => Awaitable<ApiResponse>;
export type AsyncWebsocketHandler<This> = (this: This, context: AsyncWebsocketContext) => Awaitable<void>
export type RequestHandlers<This, Route extends string> =
    & { readonly [P in RequestMethods]?: AsyncRequestHandler<This, Route> }
    & { readonly ws?: AsyncWebsocketHandler<This>; }
