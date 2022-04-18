import { Api } from '@blargbot/api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';

export class GuildsRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/guilds');

        this.addRoute('/', {
            get: (req) => this.getGuilds(this.getUserId(req))
        }).addRoute('/settings', {
            get: () => this.getGuildSettings()
        }).addRoute('/:guildId', {
            get: (req) => this.getGuild(req.params.guildId, this.getUserId(req))
        });
    }

    public async getGuildSettings(): Promise<ApiResponse> {
        const settings = await this.api.worker.request('getGuildSettings', undefined);
        return this.ok(settings);
    }

    public async getGuilds(userId: string): Promise<ApiResponse> {
        const result = await this.api.worker.request('getGuildPermissionList', { userId });
        return this.ok(result);
    }

    public async getGuild(guildId: string, userId: string): Promise<ApiResponse> {
        const result = await this.api.worker.request('getGuildPermission', { userId, guildId });
        if (result === undefined)
            return this.notFound();

        return this.ok(result);
    }
}