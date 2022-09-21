import discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';
import { auditReasonHeader } from './util';

export default {
    get: new EndpointBuilder<{ channelId: string; }, discord.RESTGetAPIGuildChannelsResult>()
        .setRoute(x => `channels/${x.channelId}`)
        .setJsonResponse()
        .build(),
    update: new EndpointBuilder<{ channelId: string; auditReason?: string; } & discord.RESTPatchAPIChannelJSONBody, discord.RESTPatchAPIChannelResult>()
        .setRoute(x => `channels/${x.channelId}`)
        .setMethod('patch')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ channelId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    delete: new EndpointBuilder<{ channelId: string; auditReason?: string; }, discord.RESTDeleteAPIChannelResult>()
        .setRoute(x => `channels/${x.channelId}`)
        .setMethod('delete')
        .setHeader(...auditReasonHeader)
        .setJsonResponse()
        .build(),
    follow: new EndpointBuilder<{ channelId: string; } & discord.RESTPostAPIChannelFollowersJSONBody, discord.RESTPostAPIChannelFollowersResult>()
        .setRoute(x => `channels/${x.channelId}/followers`)
        .setMethod('post')
        .setJsonBody(({ channelId, ...body }) => body)
        .setJsonResponse()
        .build(),
    typing: new EndpointBuilder<{ channelId: string; }, void>()
        .setRoute(x => `channels/${x.channelId}/followers`)
        .setMethod('post')
        .setEmptyResponse()
        .build()
};
