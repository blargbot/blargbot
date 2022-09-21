import discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';

export default {
    get: new EndpointBuilder<{ guildId: string; } & discord.RESTGetAPIAuditLogQuery, discord.RESTGetAPIAuditLogResult>()
        .setRoute(x => `guilds/${x.guildId}/audit-logs`)
        .setQuery(({ guildId, ...query }) => query)
        .setJsonResponse()
        .build()
};
