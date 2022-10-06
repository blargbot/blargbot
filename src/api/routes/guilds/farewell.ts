import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { mapping } from '@blargbot/mapping';

export class FarewellRoute extends BaseRoute {
    readonly #api: Api;

    public constructor(api: Api) {
        super(`/guilds`);

        this.#api = api;

        this.middleware.push(async (req, _, next) => await this.#checkAccess(req.params.guildId, this.getUserId(req, true)) ?? await next());

        this.addRoute(`/:guildId/farewell`, {
            get: ({ request }) => this.getFarewell(request.params.guildId),
            put: ({ request }) => this.setFarewell(request.params.guildId, request.body, this.getUserId(request)),
            delete: ({ request }) => this.deleteFarewell(request.params.guildId)
        });
    }

    public async getFarewell(guildId: string): Promise<ApiResponse> {
        const farewell = await this.#api.database.guilds.getFarewell(guildId);
        if (farewell === undefined)
            return this.notFound();
        return this.ok(farewell);
    }

    public async setFarewell(guildId: string, body: unknown, userId: string): Promise<ApiResponse> {
        const mapped = mapTag(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await this.#api.database.guilds.getFarewell(guildId);
        const result = { ...current, ...mapped.value, author: userId };
        if (!await this.#api.database.guilds.setFarewell(guildId, result))
            return this.internalServerError(`Failed to set farewell`);
        return this.ok(result);
    }

    public async deleteFarewell(guildId: string): Promise<ApiResponse> {
        await this.#api.database.guilds.setFarewell(guildId, undefined);
        return this.noContent();
    }

    async #checkAccess(guildId: string, userId: string | undefined): Promise<ApiResponse | undefined> {
        if (userId === undefined)
            return this.unauthorized();

        const perms = await this.#api.worker.request(`getGuildPermission`, { userId, guildId });
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
