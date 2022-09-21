import discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';
import { auditReasonHeader } from './util';

export default {
    list: new EndpointBuilder<{ channelId: string; }, discord.RESTGetAPIChannelPinsResult>()
        .setRoute(x => `channels/${x.channelId}/pins`)
        .setJsonResponse()
        .build(),
    pin: new EndpointBuilder<{ channelId: string; messageId: string; auditReason?: string; }, void>()
        .setRoute(x => `channels/${x.channelId}/pins/${x.messageId}`)
        .setMethod('put')
        .setHeader(...auditReasonHeader)
        .setEmptyResponse()
        .build(),
    unpin: new EndpointBuilder<{ channelId: string; messageId: string; auditReason?: string; }, void>()
        .setRoute(x => `channels/${x.channelId}/pins/${x.messageId}`)
        .setMethod('delete')
        .setHeader(...auditReasonHeader)
        .setEmptyResponse()
        .build()
};
