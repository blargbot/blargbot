import type discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';
import { auditReasonHeader } from './util';

export default {
    update: new EndpointBuilder<{ channelId: string; overwriteId: string; auditReason?: string; } & discord.RESTPutAPIChannelPermissionJSONBody, discord.RESTPutAPIChannelPermissionResult>()
        .setRoute(x => `channels/${x.channelId}/permissions/${x.overwriteId}`)
        .setMethod('put')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ channelId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    delete: new EndpointBuilder<{ channelId: string; overwriteId: string; auditReason?: string; }, void>()
        .setRoute(x => `channels/${x.channelId}/permissions/${x.overwriteId}`)
        .setMethod('delete')
        .setHeader(...auditReasonHeader)
        .setEmptyResponse()
        .build()
};
