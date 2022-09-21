import discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests/EndpointBuilder';

export default {
    get: new EndpointBuilder<void, discord.RESTGetAPIUserResult>()
        .setRoute('users/@me')
        .setJsonResponse()
        .build(),
    update: new EndpointBuilder<discord.RESTPatchAPICurrentUserJSONBody, discord.RESTPatchAPICurrentUserResult>()
        .setRoute('users/@me')
        .setMethod('patch')
        .setJsonBody()
        .setJsonResponse()
        .build(),
    updateMember: new EndpointBuilder<{ guildId: string; auditReason?: string; } & discord.RESTPatchAPICurrentGuildMemberJSONBody, discord.RESTGetAPIGuildMemberResult>()
        .setRoute(x => `guilds/${x.guildId}/members/@me`)
        .setMethod('patch')
        .setJsonBody(({ guildId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    connections: new EndpointBuilder<void, discord.RESTGetAPICurrentUserConnectionsResult>()
        .setRoute('users/@me/connections')
        .setJsonResponse()
        .build(),
    guilds: new EndpointBuilder<discord.RESTGetAPICurrentUserGuildsQuery, discord.RESTGetAPICurrentUserGuildsResult>()
        .setRoute('users/@me/guilds')
        .setQuery()
        .setJsonResponse()
        .build(),
    guildMember: new EndpointBuilder<{ guildId: string; }, discord.RESTGetAPIGuildMemberResult>()
        .setRoute(x => `users/@me/guilds/${x.guildId}/member`)
        .setJsonResponse()
        .build(),
    leaveGuild: new EndpointBuilder<{ guildId: string; }, void>()
        .setRoute(x => `users/@me/guilds/${x.guildId}`)
        .setMethod('delete')
        .setEmptyResponse()
        .build(),
    createDm: new EndpointBuilder<discord.RESTPostAPICurrentUserCreateDMChannelJSONBody, discord.RESTPostAPICurrentUserCreateDMChannelResult>()
        .setRoute('users/@me/channels')
        .setMethod('post')
        .setJsonBody()
        .setJsonResponse()
        .build(),
    voice: new EndpointBuilder<{ guildId: string; } & discord.RESTPatchAPIGuildVoiceStateCurrentMemberJSONBody, void>()
        .setRoute(x => `guilds/${x.guildId}/voice-states/@me`)
        .setMethod('patch')
        .setJsonBody(({ guildId, ...body }) => body)
        .setEmptyResponse()
        .build()
};
