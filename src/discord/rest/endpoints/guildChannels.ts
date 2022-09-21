import discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';
import { auditReasonHeader } from './util';

export default {
    list: new EndpointBuilder<{ guildId: string; }, discord.RESTGetAPIGuildChannelsResult>()
        .setRoute(x => `guilds/${x.guildId}/channels`)
        .setJsonResponse()
        .build(),
    create: new EndpointBuilder<{ guildId: string; auditReason?: string; } & discord.RESTPostAPIGuildChannelJSONBody, discord.RESTPostAPIGuildChannelResult>()
        .setRoute(x => `guilds/${x.guildId}/channels`)
        .setMethod('post')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ guildId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    reorder: new EndpointBuilder<{ guildId: string; channels: discord.RESTPatchAPIGuildChannelPositionsJSONBody; }, discord.RESTPatchAPIGuildChannelPositionsResult>()
        .setRoute(x => `guilds/${x.guildId}/channels`)
        .setMethod('patch')
        .setJsonBody(x => x.channels)
        .setJsonResponse()
        .build()
};
