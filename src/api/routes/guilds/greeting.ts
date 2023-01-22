import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { mapping } from '@blargbot/mapping';

export class GreetingRoute extends BaseRoute<['/guilds/:guildId/greeting']> {
    readonly #api: Api;

    public constructor(api: Api) {
        super('/guilds/:guildId/greeting');

        this.#api = api;

        this.middleware.push(async (req, _, next) => await this.#checkAccess(req.params.guildId, this.getUserId(req, true)) ?? await next());

        this.addRoute('/', {
            get: ({ request }) => this.getGreeting(request.params.guildId),
            put: ({ request }) => this.setGreeting(request.params.guildId, request.body, this.getUserId(request)),
            delete: ({ request }) => this.deleteGreeting(request.params.guildId)
        });
    }

    public async getGreeting(guildId: string): Promise<ApiResponse> {
        const greeting = await this.#api.database.guilds.getGreeting(guildId);
        if (greeting === undefined)
            return this.notFound();
        return this.ok(greeting);
    }

    public async setGreeting(guildId: string, body: unknown, userId: string): Promise<ApiResponse> {
        const request = this.mapRequestValue(body, mapTag);

        const current = await this.#api.database.guilds.getGreeting(guildId);
        const result = { ...current, ...request, author: userId };
        if (!await this.#api.database.guilds.setGreeting(guildId, result))
            return this.internalServerError('Failed to set greeting');
        return this.ok(result);
    }

    public async deleteGreeting(guildId: string): Promise<ApiResponse> {
        await this.#api.database.guilds.setGreeting(guildId, undefined);
        return this.noContent();
    }

    async #checkAccess(guildId: string, userId: string | undefined): Promise<ApiResponse | undefined> {
        if (userId === undefined)
            return this.unauthorized();

        const perms = await this.#api.worker.request('getGuildPermission', { userId, guildId });
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
