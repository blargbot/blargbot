import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';

export class GuildsRoute extends BaseRoute {
    readonly #api: Api;

    public constructor(api: Api) {
        super(`/guilds`);

        this.#api = api;

        this.addRoute(`/`, {
            get: ({ request }) => this.getGuilds(this.getUserId(request))
        }).addRoute(`/settings`, {
            get: () => this.getGuildSettings()
        }).addRoute(`/:guildId`, {
            get: ({ request }) => this.getGuild(request.params.guildId, this.getUserId(request))
        });
    }

    public async getGuildSettings(): Promise<ApiResponse> {
        const settings = await this.#api.worker.request(`getGuildSettings`, undefined);
        return this.ok(settings);
    }

    public async getGuilds(userId: string): Promise<ApiResponse> {
        const result = await this.#api.worker.request(`getGuildPermissionList`, { userId });
        return this.ok(result);
    }

    public async getGuild(guildId: string, userId: string): Promise<ApiResponse> {
        const result = await this.#api.worker.request(`getGuildPermission`, { userId, guildId });
        if (result === undefined)
            return this.notFound();

        return this.ok(result);
    }
}
