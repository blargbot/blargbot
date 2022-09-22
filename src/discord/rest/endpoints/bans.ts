import type discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';
import { auditReasonHeaderUnencoded } from './util';

export default {
    get: new EndpointBuilder<{ guildId: string; userId: string; }, discord.RESTGetAPIGuildBanResult>()
        .setRoute(x => `guilds/${x.guildId}/bans/${x.userId}`)
        .setJsonResponse()
        .build(),
    create: new EndpointBuilder<{ guildId: string; userId: string; auditReason?: string; } & discord.RESTPutAPIGuildBanJSONBody, void>()
        .setRoute(x => `guilds/${x.guildId}/bans/${x.userId}`)
        .setMethod('put')
        .setHeader(...auditReasonHeaderUnencoded)
        .setJsonBody(({ guildId, userId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    delete: new EndpointBuilder<{ guildId: string; userId: string; auditReason?: string; }, void>()
        .setRoute(x => `guilds/${x.guildId}/bans/${x.userId}`)
        .setMethod('delete')
        .setHeader(...auditReasonHeaderUnencoded)
        .setEmptyResponse()
        .build()
};
