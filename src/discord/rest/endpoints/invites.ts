import discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';
import { auditReasonHeader } from './util';

export default {
    get: new EndpointBuilder<{ inviteId: string; } & discord.RESTGetAPIInviteQuery, discord.RESTGetAPIInviteResult>()
        .setRoute(x => `invites/${x.inviteId}`)
        .setQuery(({ inviteId, ...query }) => query)
        .setJsonResponse()
        .build(),
    delete: new EndpointBuilder<{ inviteId: string; }, discord.RESTDeleteAPIInviteResult>()
        .setRoute(x => `invites/${x.inviteId}`)
        .setMethod('delete')
        .setJsonResponse()
        .build(),
    listForGuild: new EndpointBuilder<{ guildId: string; }, discord.RESTGetAPIGuildInvitesResult>()
        .setRoute(x => `guilds/${x.guildId}/invites`)
        .setJsonResponse()
        .build(),
    listForChannel: new EndpointBuilder<{ channelId: string; }, discord.RESTGetAPIChannelInvitesResult>()
        .setRoute(x => `channels/${x.channelId}/invites`)
        .setJsonResponse()
        .build(),
    create: new EndpointBuilder<{ channelId: string; auditReason?: string; } & discord.RESTPostAPIChannelInviteJSONBody, discord.RESTPostAPIChannelInviteResult>()
        .setRoute(x => `channels/${x.channelId}/invites`)
        .setMethod('post')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ channelId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build()
};
