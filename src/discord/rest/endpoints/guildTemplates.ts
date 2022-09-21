import discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';

export default {
    get: new EndpointBuilder<{ templateId: string; }, discord.RESTGetAPITemplateResult>()
        .setRoute(x => `guilds/templates/${x.templateId}`)
        .setJsonResponse()
        .build(),
    createGuild: new EndpointBuilder<{ templateId: string; } & discord.RESTPostAPITemplateCreateGuildJSONBody, discord.RESTPostAPITemplateCreateGuildResult>()
        .setRoute(x => `guilds/templates/${x.templateId}`)
        .setMethod('post')
        .setJsonBody(({ templateId, ...body }) => body)
        .setJsonResponse()
        .build(),
    list: new EndpointBuilder<{ guildId: string; }, discord.RESTGetAPIGuildTemplatesResult>()
        .setRoute(x => `guilds/${x.guildId}/templates`)
        .setJsonResponse()
        .build(),
    create: new EndpointBuilder<{ guildId: string; } & discord.RESTPostAPIGuildTemplatesJSONBody, discord.RESTPostAPIGuildTemplatesResult>()
        .setRoute(x => `guilds/${x.guildId}/templates`)
        .setMethod('post')
        .setJsonBody(({ guildId, ...body }) => body)
        .setJsonResponse()
        .build(),
    sync: new EndpointBuilder<{ guildId: string; templateId: string; }, discord.RESTPutAPIGuildTemplateSyncResult>()
        .setRoute(x => `guilds/${x.guildId}/templates/${x.templateId}`)
        .setMethod('put')
        .setJsonResponse()
        .build(),
    update: new EndpointBuilder<{ guildId: string; templateId: string; } & discord.RESTPatchAPIGuildTemplateJSONBody, discord.RESTPatchAPIGuildTemplateResult>()
        .setRoute(x => `guilds/${x.guildId}/templates/${x.templateId}`)
        .setMethod('patch')
        .setJsonBody(({ guildId, templateId, ...body }) => body)
        .setJsonResponse()
        .build(),
    delete: new EndpointBuilder<{ guildId: string; templateId: string; }, discord.RESTDeleteAPIGuildTemplateResult>()
        .setRoute(x => `guilds/${x.guildId}/templates/${x.templateId}`)
        .setMethod('delete')
        .setJsonResponse()
        .build()
};
