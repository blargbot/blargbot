import type { HttpClient, HttpClientOptions } from '@blargbot/api-client';
import { defineApiClient } from '@blargbot/api-client';
import type Discord from '@blargbot/discord-types';

export type RoleCacheRoleResponse = Discord.APIRole;
export interface RoleCacheGuildRequestParams {
    readonly guildId: string | bigint;
}

export interface RoleCacheRoleRequestParams {
    readonly roleId: string | bigint;
}
export interface RoleCacheGuildRoleRequestParams extends RoleCacheRoleRequestParams, RoleCacheGuildRequestParams {

}

export class DiscordRoleCacheHttpClient extends defineApiClient({
    getGuildRole: b => b.route<RoleCacheGuildRoleRequestParams>(x => `${x.guildId}/${x.roleId}`)
        .response<RoleCacheRoleResponse>(200)
        .response(404, () => undefined),
    getGuildRoles: b => b.route<RoleCacheGuildRequestParams>(x => `${x.guildId}`)
        .response<RoleCacheRoleResponse[]>(200),
    deleteGuild: b => b.route<RoleCacheGuildRequestParams>('DELETE', x => `${x.guildId}`)
        .response(204),
    clear: b => b.route('DELETE', '')
        .response(204)
}) {
    public static from(options: DiscordRoleCacheHttpClient | HttpClient | HttpClientOptions | string | URL | undefined): DiscordRoleCacheHttpClient {
        if (options instanceof DiscordRoleCacheHttpClient)
            return options;
        if (options === undefined)
            throw new Error('No configuration provided for client');
        return new DiscordRoleCacheHttpClient(options);
    }
}
