import type discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests/EndpointBuilder';

export default {
    addSelf: new EndpointBuilder<{ channelId: string; messageId: string; emoji: string; }, void>()
        .setRoute(x => `channels/${x.channelId}/messages/${x.messageId}/reactions/${x.emoji}/@me`)
        .setMethod('put')
        .setEmptyResponse()
        .build(),
    removeSelf: new EndpointBuilder<{ channelId: string; messageId: string; emoji: string; }, void>()
        .setRoute(x => `channels/${x.channelId}/messages/${x.messageId}/reactions/${x.emoji}/@me`)
        .setMethod('delete')
        .setEmptyResponse()
        .build(),
    removeUser: new EndpointBuilder<{ channelId: string; messageId: string; emoji: string; userId: string; }, void>()
        .setRoute(x => `channels/${x.channelId}/messages/${x.messageId}/reactions/${x.emoji}/${x.userId}`)
        .setMethod('delete')
        .setEmptyResponse()
        .build(),
    removeAll: new EndpointBuilder<{ channelId: string; messageId: string; }, void>()
        .setRoute(x => `channels/${x.channelId}/messages/${x.messageId}/reactions`)
        .setMethod('delete')
        .setEmptyResponse()
        .build(),
    removeEmoji: new EndpointBuilder<{ channelId: string; messageId: string; emoji: string; }, void>()
        .setRoute(x => `channels/${x.channelId}/messages/${x.messageId}/reactions/${x.emoji}`)
        .setMethod('delete')
        .setEmptyResponse()
        .build(),
    get: new EndpointBuilder<{ channelId: string; messageId: string; emoji: string; } & discord.RESTGetAPIChannelMessageReactionUsersQuery, discord.RESTGetAPIChannelMessageReactionUsersResult>()
        .setRoute(x => `channels/${x.channelId}/messages/${x.messageId}/reactions/${x.emoji}`)
        .setMethod('get')
        .setQuery(({ channelId, messageId, emoji, ...query }) => query)
        .setJsonResponse()
        .build()
};
