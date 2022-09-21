import discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';
import { auditReasonHeader } from './util';

export default {
    list: new EndpointBuilder<{ guildId: string; }, discord.RESTGetAPIGuildEmojisResult>()
        .setRoute(x => `guilds/${x.guildId}/emojis`)
        .setJsonResponse()
        .build(),
    get: new EndpointBuilder<{ guildId: string; emojiId: string; }, discord.RESTGetAPIGuildEmojiResult>()
        .setRoute(x => `guilds/${x.guildId}/emojis/${x.emojiId}`)
        .setJsonResponse()
        .build(),
    create: new EndpointBuilder<{ guildId: string; auditReason?: string; } & discord.RESTPostAPIGuildEmojiJSONBody, discord.RESTPostAPIGuildEmojiResult>()
        .setRoute(x => `guilds/${x.guildId}/emojis`)
        .setMethod('post')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ guildId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    update: new EndpointBuilder<{ guildId: string; emojiId: string; auditReason?: string; } & discord.RESTPatchAPIGuildEmojiJSONBody, discord.RESTPatchAPIGuildEmojiResult>()
        .setRoute(x => `guilds/${x.guildId}/emojis/${x.emojiId}`)
        .setMethod('patch')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ guildId, emojiId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    delete: new EndpointBuilder<{ guildId: string; emojiId: string; auditReason?: string; }, void>()
        .setRoute(x => `guilds/${x.guildId}/emojis/${x.emojiId}`)
        .setMethod('delete')
        .setHeader(...auditReasonHeader)
        .setEmptyResponse()
        .build()
};
