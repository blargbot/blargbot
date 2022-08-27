import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { mapping } from '@blargbot/mapping';

export class IntervalRoute extends BaseRoute {
    public constructor() {
        super('/guilds');

        this.middleware.push(async (ctx, next) => await this.#checkAccess(ctx.api, ctx.request.params.guildId, this.getUserId(ctx.request, true)) ?? await next());

        this.addRoute('/:guildId/interval', {
            get: ({ request, api }) => this.getInterval(api, request.params.guildId),
            put: ({ request, api }) => this.setInterval(api, request.params.guildId, request.body, this.getUserId(request)),
            delete: ({ request, api }) => this.deleteInterval(api, request.params.guildId)
        });
    }

    public async getInterval(api: Api, guildId: string): Promise<ApiResponse> {
        const interval = await api.database.guilds.getInterval(guildId);
        if (interval === undefined)
            return this.notFound();
        return this.ok(interval);
    }

    public async setInterval(api: Api, guildId: string, body: unknown, userId: string): Promise<ApiResponse> {
        const mapped = mapTag(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await api.database.guilds.getInterval(guildId);
        const result = { ...current, ...mapped.value, author: userId };
        if (!await api.database.guilds.setInterval(guildId, result))
            return this.internalServerError('Failed to set interval');
        return this.ok(result);
    }

    public async deleteInterval(api: Api, guildId: string): Promise<ApiResponse> {
        await api.database.guilds.setInterval(guildId, undefined);
        return this.noContent();
    }

    async #checkAccess(api: Api, guildId: string, userId: string | undefined): Promise<ApiResponse | undefined> {
        if (userId === undefined)
            return this.unauthorized();

        const perms = await api.worker.request('getGuildPermission', { userId, guildId });
        if (perms === undefined)
            return this.notFound();

        if (!perms.interval)
            return this.forbidden(`You cannot edit the interval on guild ${guildId}`);

        return undefined;
    }
}

const mapTag = mapping.object({
    content: mapping.string
});
