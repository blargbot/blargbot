import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { mapping } from '@blargbot/mapping';

export class GreetingRoute extends BaseRoute {
    public constructor() {
        super('/guilds');

        this.middleware.push(async (ctx, next) => await this.#checkAccess(ctx.api, ctx.request.params.guildId, this.getUserId(ctx.request, true)) ?? await next());

        this.addRoute('/:guildId/greeting', {
            get: ({ request, api }) => this.getGreeting(api, request.params.guildId),
            put: ({ request, api }) => this.setGreeting(api, request.params.guildId, request.body, this.getUserId(request)),
            delete: ({ request, api }) => this.deleteGreeting(api, request.params.guildId)
        });
    }

    public async getGreeting(api: Api, guildId: string): Promise<ApiResponse> {
        const greeting = await api.database.guilds.getGreeting(guildId);
        if (greeting === undefined)
            return this.notFound();
        return this.ok(greeting);
    }

    public async setGreeting(api: Api, guildId: string, body: unknown, userId: string): Promise<ApiResponse> {
        const mapped = mapTag(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await api.database.guilds.getGreeting(guildId);
        const result = { ...current, ...mapped.value, author: userId };
        if (!await api.database.guilds.setGreeting(guildId, result))
            return this.internalServerError('Failed to set greeting');
        return this.ok(result);
    }

    public async deleteGreeting(api: Api, guildId: string): Promise<ApiResponse> {
        await api.database.guilds.setGreeting(guildId, undefined);
        return this.noContent();
    }

    async #checkAccess(api: Api, guildId: string, userId: string | undefined): Promise<ApiResponse | undefined> {
        if (userId === undefined)
            return this.unauthorized();

        const perms = await api.worker.request('getGuildPermission', { userId, guildId });
        if (perms === undefined)
            return this.notFound();

        if (!perms.greeting)
            return this.forbidden(`You cannot edit the greeting on guild ${guildId}`);

        return undefined;
    }
}

const mapTag = mapping.object({
    content: mapping.string
});
