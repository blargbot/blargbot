import type discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';
import { auditReasonHeader } from './util';

export default {
    get: new EndpointBuilder<{ channelId: string; }, discord.RESTGetAPIStageInstanceResult>()
        .setRoute(x => `stage-instances/${x.channelId}`)
        .setJsonResponse()
        .build(),
    create: new EndpointBuilder<{ auditReason?: string; } & discord.RESTPostAPIStageInstanceJSONBody, discord.RESTPostAPIStageInstanceResult>()
        .setRoute('stage-instances')
        .setMethod('post')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    update: new EndpointBuilder<{ channelId: string; auditReason?: string; } & discord.RESTPatchAPIStageInstanceJSONBody, discord.RESTPatchAPIStageInstanceResult>()
        .setRoute(x => `stage-instances/${x.channelId}`)
        .setMethod('patch')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ channelId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    delete: new EndpointBuilder<{ channelId: string; auditReason?: string; }, void>()
        .setRoute(x => `stage-instances/${x.channelId}`)
        .setMethod('delete')
        .setHeader(...auditReasonHeader)
        .setEmptyResponse()
        .build()
};
