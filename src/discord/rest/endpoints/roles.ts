import type discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';
import { auditReasonHeader } from './util';

export default {
    list: new EndpointBuilder<{ guildId: string; }, discord.RESTGetAPIGuildRolesResult>()
        .setRoute(x => `guilds/${x.guildId}/roles`)
        .setJsonResponse()
        .build(),
    create: new EndpointBuilder<{ guildId: string; auditReason?: string; } & discord.RESTPostAPIGuildRoleJSONBody, discord.RESTPostAPIGuildRoleResult>()
        .setRoute(x => `guilds/${x.guildId}/roles`)
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ guildId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    update: new EndpointBuilder<{ guildId: string; roleId: string; auditReason?: string; } & discord.RESTPatchAPIGuildRoleJSONBody, discord.RESTPatchAPIGuildRoleResult>()
        .setRoute(x => `guilds/${x.guildId}/roles/${x.roleId}`)
        .setMethod('patch')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ guildId, roleId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    delete: new EndpointBuilder<{ guildId: string; roleId: string; auditReason?: string; }, void>()
        .setRoute(x => `guilds/${x.guildId}/roles/${x.roleId}`)
        .setMethod('delete')
        .setHeader(...auditReasonHeader)
        .setEmptyResponse()
        .build(),
    reorder: new EndpointBuilder<{ guildId: string; auditReason?: string; roles: discord.RESTPatchAPIGuildRolePositionsJSONBody; }, discord.RESTPatchAPIGuildRolePositionsResult>()
        .setRoute(x => `guilds/${x.guildId}/roles`)
        .setMethod('patch')
        .setHeader(...auditReasonHeader)
        .setJsonBody(x => x.roles)
        .setJsonResponse()
        .build(),
    grant: new EndpointBuilder<{ guildId: string; userId: string; roleId: string; auditReason?: string; }, void>()
        .setRoute(x => `guilds/${x.guildId}/members/${x.userId}/roles/${x.roleId}`)
        .setMethod('put')
        .setHeader(...auditReasonHeader)
        .setEmptyResponse()
        .build(),
    revoke: new EndpointBuilder<{ guildId: string; userId: string; roleId: string; auditReason?: string; }, void>()
        .setRoute(x => `guilds/${x.guildId}/members/${x.userId}/roles/${x.roleId}`)
        .setMethod('delete')
        .setHeader(...auditReasonHeader)
        .setEmptyResponse()
        .build()
};
