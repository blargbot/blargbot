import { Api } from '@api';
import { BaseRoute } from '@api/BaseRoute';
import { ApiResponse } from '@api/types';

export class GuildsRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/guilds');

        this.addRoute('/', {
            get: (req) => this.getGuilds(this.getUserId(req))
        }).addRoute('/:guildId', {
            get: (req) => this.getGuild(req.params.guildId, this.getUserId(req))
        });
    }

    public async getGuilds(userId: string | undefined): Promise<ApiResponse> {
        if (userId === undefined)
            return this.forbidden();

        const result = await this.api.worker.request('getGuildPermssionList', { userId });
        return this.ok(result);
    }

    public async getGuild(guildId: string, userId: string | undefined): Promise<ApiResponse> {
        if (userId === undefined)
            return this.forbidden();

        const result = await this.api.worker.request('getGuildPermssion', { userId, guildId });
        if (result === undefined)
            return this.notFound();

        return this.ok(result);
    }
}
