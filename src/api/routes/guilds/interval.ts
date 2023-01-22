import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { mapping } from '@blargbot/mapping';

export class IntervalRoute extends BaseRoute<['/guilds/:guildId/interval']> {
    readonly #api: Api;

    public constructor(api: Api) {
        super('/guilds/:guildId/interval');

        this.#api = api;

        this.middleware.push(async (req, _, next) => await this.#checkAccess(req.params.guildId, this.getUserId(req, true)) ?? await next());

        this.addRoute('/', {
            get: ({ request }) => this.getInterval(request.params.guildId),
            put: ({ request }) => this.setInterval(request.params.guildId, request.body, this.getUserId(request)),
            delete: ({ request }) => this.deleteInterval(request.params.guildId)
        });
    }

    public async getInterval(guildId: string): Promise<ApiResponse> {
        const interval = await this.#api.database.guilds.getInterval(guildId);
        if (interval === undefined)
            return this.notFound();
        return this.ok(interval);
    }

    public async setInterval(guildId: string, body: unknown, userId: string): Promise<ApiResponse> {
        const request = this.mapRequestValue(body, mapTag);

        const current = await this.#api.database.guilds.getInterval(guildId);
        const result = { ...current, ...request, author: userId };
        if (!await this.#api.database.guilds.setInterval(guildId, result))
            return this.internalServerError('Failed to set interval');
        return this.ok(result);
    }

    public async deleteInterval(guildId: string): Promise<ApiResponse> {
        await this.#api.database.guilds.setInterval(guildId, undefined);
        return this.noContent();
    }

    async #checkAccess(guildId: string, userId: string | undefined): Promise<ApiResponse | undefined> {
        if (userId === undefined)
            return this.unauthorized();

        const perms = await this.#api.worker.request('getGuildPermission', { userId, guildId });
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
