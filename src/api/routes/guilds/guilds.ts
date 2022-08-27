import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';

export class GuildsRoute extends BaseRoute {
    public constructor() {
        super('/guilds');

        this.addRoute('/', {
            get: ({ request, api }) => this.getGuilds(api, this.getUserId(request))
        }).addRoute('/settings', {
            get: ({ api }) => this.getGuildSettings(api)
        }).addRoute('/:guildId', {
            get: ({ request, api }) => this.getGuild(api, request.params.guildId, this.getUserId(request))
        });
    }

    public async getGuildSettings(api: Api): Promise<ApiResponse> {
        const settings = await api.worker.request('getGuildSettings', undefined);
        return this.ok(settings);
    }

    public async getGuilds(api: Api, userId: string): Promise<ApiResponse> {
        const result = await api.worker.request('getGuildPermissionList', { userId });
        return this.ok(result);
    }

    public async getGuild(api: Api, guildId: string, userId: string): Promise<ApiResponse> {
        const result = await api.worker.request('getGuildPermission', { userId, guildId });
        if (result === undefined)
            return this.notFound();

        return this.ok(result);
    }
}
