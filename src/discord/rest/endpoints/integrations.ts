import discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';
import { auditReasonHeader } from './util';

export default {
    get: new EndpointBuilder<{ guildId: string; }, discord.RESTGetAPIGuildIntegrationsResult>()
        .setRoute(x => `guilds/${x.guildId}/integrations`)
        .setJsonResponse()
        .build(),
    delete: new EndpointBuilder<{ guildId: string; integrationId: string; auditReason?: string; }, void>()
        .setRoute(x => `guilds/${x.guildId}/integrations/${x.integrationId}`)
        .setMethod('delete')
        .setHeader(...auditReasonHeader)
        .setEmptyResponse()
        .build()
};
