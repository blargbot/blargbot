import type discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';
import { auditReasonHeaderUnencoded } from './util';

export default {
    get: new EndpointBuilder<{ guildId: string; } & discord.RESTGetAPIGuildPruneCountQuery, discord.RESTGetAPIGuildPruneCountResult>()
        .setRoute(x => `guilds/${x.guildId}/prune`)
        .setQuery(({ guildId, ...query }) => query)
        .setJsonResponse()
        .build(),
    start: new EndpointBuilder<{ guildId: string; auditReason?: string; } & discord.RESTPostAPIGuildPruneJSONBody, discord.RESTPostAPIGuildPruneResult>()
        .setRoute(x => `guilds/${x.guildId}/prune`)
        .setMethod('post')
        .setHeader(...auditReasonHeaderUnencoded)
        .setJsonBody(({ guildId, ...query }) => query)
        .setJsonResponse()
        .build()
};
