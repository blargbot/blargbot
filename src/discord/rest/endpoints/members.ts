import discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';
import { auditReasonHeader } from './util';

export default {
    get: new EndpointBuilder<{ guildId: string; userId: string; }, discord.RESTGetAPIGuildMemberResult>()
        .setRoute(x => `guilds/${x.guildId}/members/${x.userId}`)
        .setJsonResponse()
        .build(),
    list: new EndpointBuilder<{ guildId: string; } & discord.RESTGetAPIGuildMembersQuery, discord.RESTGetAPIGuildMembersResult>()
        .setRoute(x => `guilds/${x.guildId}/members`)
        .setQuery(({ guildId, ...query }) => query)
        .setJsonResponse()
        .build(),
    search: new EndpointBuilder<{ guildId: string; } & discord.RESTGetAPIGuildMembersSearchQuery, discord.RESTGetAPIGuildMembersSearchResult>()
        .setRoute(x => `guilds/${x.guildId}/members/search`)
        .setQuery(({ guildId, ...query }) => query)
        .setJsonResponse()
        .build(),
    add: new EndpointBuilder<{ guildId: string; userId: string; } & discord.RESTPutAPIGuildMemberJSONBody, discord.RESTPutAPIGuildMemberResult>()
        .setRoute(x => `guilds/${x.guildId}/members/${x.userId}`)
        .setMethod('put')
        .setJsonBody(({ guildId, userId, ...body }) => body)
        .setJsonResponse()
        .build(),
    update: new EndpointBuilder<{ guildId: string; userId: string; auditReason?: string; } & discord.RESTPatchAPIGuildMemberJSONBody, discord.RESTPatchAPIGuildMemberResult>()
        .setRoute(x => `guilds/${x.guildId}/members/${x.userId}`)
        .setMethod('patch')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ guildId, userId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    remove: new EndpointBuilder<{ guildId: string; userId: string; }, void>()
        .setRoute(x => `guilds/${x.guildId}/members/${x.userId}`)
        .setMethod('delete')
        .setEmptyResponse()
        .build(),
    setVoice: new EndpointBuilder<{ guildId: string; userId: string; } & discord.RESTPatchAPIGuildVoiceStateUserJSONBody, void>()
        .setRoute(x => `guilds/${x.guildId}/voice-states/${x.userId}`)
        .setMethod('patch')
        .setJsonBody(({ guildId, ...body }) => body)
        .setEmptyResponse()
        .build()
};
