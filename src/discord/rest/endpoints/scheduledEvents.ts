import discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';
import { auditReasonHeader } from './util';

export default {
    list: new EndpointBuilder<{ guildId: string; } & discord.RESTGetAPIGuildScheduledEventsQuery, discord.RESTGetAPIGuildScheduledEventsResult>()
        .setRoute(x => `guilds/${x.guildId}/scheduled-events`)
        .setQuery(({ guildId, ...query }) => query)
        .setJsonResponse()
        .build(),
    get: new EndpointBuilder<{ guildId: string; eventId: string; } & discord.RESTGetAPIGuildScheduledEventQuery, discord.RESTGetAPIGuildScheduledEventResult>()
        .setRoute(x => `guilds/${x.guildId}/scheduled-events/${x.eventId}`)
        .setQuery(({ guildId, eventId, ...query }) => query)
        .setJsonResponse()
        .build(),
    create: new EndpointBuilder<{ guildId: string; auditReason?: string; } & discord.RESTPostAPIGuildScheduledEventJSONBody, discord.RESTPostAPIGuildScheduledEventResult>()
        .setRoute(x => `guilds/${x.guildId}/scheduled-events`)
        .setMethod('post')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ guildId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    update: new EndpointBuilder<{ guildId: string; eventId: string; auditReason?: string; } & discord.RESTPatchAPIGuildScheduledEventJSONBody, discord.RESTPatchAPIGuildScheduledEventResult>()
        .setRoute(x => `guilds/${x.guildId}/scheduled-events/${x.eventId}`)
        .setMethod('patch')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ guildId, eventId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    delete: new EndpointBuilder<{ guildId: string; eventId: string; auditReason?: string; }, void>()
        .setRoute(x => `guilds/${x.guildId}/scheduled-events/${x.eventId}`)
        .setMethod('delete')
        .setHeader(...auditReasonHeader)
        .setEmptyResponse()
        .build(),
    users: new EndpointBuilder<{ guildId: string; eventId: string; } & discord.RESTGetAPIGuildScheduledEventUsersQuery, discord.RESTGetAPIGuildScheduledEventUsersResult>()
        .setRoute(x => `guilds/${x.guildId}/scheduled-events/${x.eventId}/users`)
        .setQuery(({ guildId, eventId, ...query }) => query)
        .setJsonResponse()
        .build()
};
