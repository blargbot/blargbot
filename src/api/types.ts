import { ClusterStats, CommandListResult, GuildPermissionDetails, ICommandDetails, SubtagDetails, SubtagListResult } from '@blargbot/cluster/types';
import { ChatLogIndex } from '@blargbot/domain/models/chatLogs';
import { Request, Response } from 'express';
import { NextFunction, RouteParameters } from 'express-serve-static-core';

import { ApiWorker } from './ApiWorker';

export type ApiIPCContracts = {
    'getSubtagList': { masterGets: undefined; workerGets: SubtagListResult; };
    'getSubtag': { masterGets: string; workerGets: SubtagDetails | undefined; };
    'getGuildPermissionList': { masterGets: { userId: string; }; workerGets: GuildPermissionDetails[]; };
    'getGuildPermission': { masterGets: { userId: string; guildId: string; }; workerGets: GuildPermissionDetails | undefined; };
    'getCommandList': { masterGets: undefined; workerGets: CommandListResult; };
    'getCommand': { masterGets: string; workerGets: ICommandDetails | undefined; };
    'getClusterStats': { masterGets: undefined; workerGets: Record<number, ClusterStats | undefined>; };
    'getChatLogs': { masterGets: string; workerGets: ChatLogIndex | undefined; };
}

export interface ApiOptions {
    worker: ApiWorker;
}

export interface ApiResponse {
    execute(response: Response): Awaitable<void>;
}

export type RequestMethods = 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head'
export type AsyncRequestHandler<Route extends string> = (req: Request<RouteParameters<Route>>, res: Response, next: NextFunction) => Awaitable<ApiResponse>;
export type RequestHandlers<Route extends string> = { [P in RequestMethods]?: AsyncRequestHandler<Route> }
