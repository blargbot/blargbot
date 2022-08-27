import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { mapping } from '@blargbot/mapping';

export class FarewellRoute extends BaseRoute {
    public constructor() {
        super('/guilds');

        this.middleware.push(async (ctx, next) => await this.#checkAccess(ctx.api, ctx.request.params.guildId, this.getUserId(ctx.request, true)) ?? await next());

        this.addRoute('/:guildId/farewell', {
            get: ({ request, api }) => this.getFarewell(api, request.params.guildId),
            put: ({ request, api }) => this.setFarewell(api, request.params.guildId, request.body, this.getUserId(request)),
            delete: ({ request, api }) => this.deleteFarewell(api, request.params.guildId)
        });
    }

    public async getFarewell(api: Api, guildId: string): Promise<ApiResponse> {
        const farewell = await api.database.guilds.getFarewell(guildId);
        if (farewell === undefined)
            return this.notFound();
        return this.ok(farewell);
    }

    public async setFarewell(api: Api, guildId: string, body: unknown, userId: string): Promise<ApiResponse> {
        const mapped = mapTag(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await api.database.guilds.getFarewell(guildId);
        const result = { ...current, ...mapped.value, author: userId };
        if (!await api.database.guilds.setFarewell(guildId, result))
            return this.internalServerError('Failed to set farewell');
        return this.ok(result);
    }

    public async deleteFarewell(api: Api, guildId: string): Promise<ApiResponse> {
        await api.database.guilds.setFarewell(guildId, undefined);
        return this.noContent();
    }

    async #checkAccess(api: Api, guildId: string, userId: string | undefined): Promise<ApiResponse | undefined> {
        if (userId === undefined)
            return this.unauthorized();

        const perms = await api.worker.request('getGuildPermission', { userId, guildId });
        if (perms === undefined)
            return this.notFound();

        if (!perms.farewell)
            return this.forbidden(`You cannot edit the farewell on guild ${guildId}`);

        return undefined;
    }
}

const mapTag = mapping.object({
    content: mapping.string
});
