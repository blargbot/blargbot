import discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';
import { auditReasonHeader } from './util';

export default {
    get: new EndpointBuilder<{ guildId: string; }, discord.RESTGetAPIGuildWidgetJSONResult>()
        .setRoute(x => `guilds/${x.guildId}/widget.json`)
        .setJsonResponse()
        .build(),
    image: new EndpointBuilder<{ guildId: string; } & discord.RESTGetAPIGuildWidgetImageQuery, discord.RESTGetAPIGuildWidgetImageResult>()
        .setRoute(x => `guilds/${x.guildId}/widget.png`)
        .setQuery(({ guildId, ...query }) => query)
        .setBufferResponse('image/png')
        .build(),
    settings: new EndpointBuilder<{ guildId: string; }, discord.RESTGetAPIGuildWidgetSettingsResult>()
        .setRoute(x => `guilds/${x.guildId}/widget`)
        .setJsonResponse()
        .build(),
    update: new EndpointBuilder<{ guildId: string; widgetId: string; auditReason?: string; } & discord.RESTPatchAPIGuildWidgetSettingsJSONBody, discord.RESTPatchAPIGuildWidgetSettingsResult>()
        .setRoute(x => `guilds/${x.guildId}/widget/${x.widgetId}`)
        .setMethod('patch')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ guildId, widgetId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build()
};
