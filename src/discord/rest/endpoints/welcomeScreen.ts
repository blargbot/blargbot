import type discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';
import { auditReasonHeader } from './util';

export default {
    get: new EndpointBuilder<{ guildId: string; }, discord.RESTGetAPIGuildWelcomeScreenResult>()
        .setRoute(x => `guilds/${x.guildId}/welcome-screen`)
        .setJsonResponse()
        .build(),
    update: new EndpointBuilder<{ guildId: string; auditReason?: string; } & discord.RESTPatchAPIGuildWelcomeScreenJSONBody, discord.RESTPatchAPIGuildWelcomeScreenResult>()
        .setRoute(x => `guilds/${x.guildId}/welcome-screen`)
        .setMethod('patch')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ guildId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build()
};
