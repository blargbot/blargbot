import type discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';
import { auditReasonHeader } from './util';

export default {
    get: new EndpointBuilder<{ guildId: string; } & discord.RESTGetAPIGuildQuery, discord.RESTGetAPIGuildResult>()
        .setRoute(x => `guilds/${x.guildId}`)
        .setQuery(({ guildId, ...query }) => query)
        .setJsonResponse()
        .build(),
    preview: new EndpointBuilder<{ guildId: string; }, discord.RESTGetAPIGuildPreviewResult>()
        .setRoute(x => `guilds/${x.guildId}/preview`)
        .setJsonResponse()
        .build(),
    update: new EndpointBuilder<{ guildId: string; auditReason?: string; } & discord.RESTPatchAPIGuildJSONBody, discord.RESTPatchAPIGuildResult>()
        .setRoute(x => `guilds/${x.guildId}`)
        .setMethod('patch')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ guildId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    delete: new EndpointBuilder<{ guildId: string; }, void>()
        .setRoute(x => `guilds/${x.guildId}`)
        .setMethod('delete')
        .setEmptyResponse()
        .build(),
    setMfa: new EndpointBuilder<{ guildId: string; auditReason?: string; } & discord.RESTPostAPIGuildsMFAJSONBody, discord.RESTPostAPIGuildsMFAResult>()
        .setRoute(x => `guilds/${x.guildId}/mfa`)
        .setMethod('patch')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ guildId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    regions: new EndpointBuilder<{ guildId: string; }, discord.RESTGetAPIGuildVoiceRegionsResult>()
        .setRoute(x => `guilds/${x.guildId}/regions`)
        .setJsonResponse()
        .build(),
    vanityUrl: new EndpointBuilder<{ guildId: string; }, discord.RESTGetAPIGuildVanityUrlResult>()
        .setRoute(x => `guilds/${x.guildId}/vanity-url`)
        .setJsonResponse()
        .build()
};
