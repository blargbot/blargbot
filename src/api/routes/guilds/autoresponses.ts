import type { GuildTriggerTag } from '@blargbot/domain';
import z from 'zod';

import type { Api } from '../../Api.js';
import { BaseRoute } from '../../BaseRoute.js';
import type { ApiResponse } from '../../types.js';

export class AutoresponsesRoute extends BaseRoute<['/guilds/:guildId/autoresponses']> {
    readonly #api: Api;

    public constructor(api: Api) {
        super('/guilds/:guildId/autoresponses');

        this.#api = api;

        this.middleware.push(async (req, _, next) => await this.#checkAccess(req.params.guildId, this.getUserId(req, true)) ?? await next());

        this.addRoute('/', {
            get: ({ request }) => this.listAutoresponses(request.params.guildId),
            post: () => this.createAutoresponse()
        });

        this.addRoute('/:id', {
            get: ({ request }) => this.getAutoresponse(request.params.guildId, request.params.id),
            patch: ({ request }) => this.editAutoresponse(request.params.guildId, request.params.id, request.body, this.getUserId(request)),
            delete: ({ request }) => this.deleteAutoresponse(request.params.guildId, request.params.id)
        });
    }

    public createAutoresponse(): ApiResponse {
        return this.badRequest({ message: 'Creating autoresponses via the API isnt supported yet!' });
    }

    public async deleteAutoresponse(guildId: string, id: string): Promise<ApiResponse> {
        const key = await this.mapRequestValue(id, mapId);

        if (!await this.#api.database.guilds.setAutoresponse(guildId, key, undefined))
            return this.notFound();

        return this.noContent();
    }

    public async listAutoresponses(guildId: string): Promise<ApiResponse> {
        const autoresponses = await this.#api.database.guilds.getAutoresponses(guildId);
        if (autoresponses === undefined)
            return this.notFound();

        return this.ok(autoresponses);
    }

    public async getAutoresponse(guildId: string, id: string): Promise<ApiResponse> {
        const key = await this.mapRequestValue(id, mapId);
        const autoresponse = await this.#api.database.guilds.getAutoresponse(guildId, key);
        if (autoresponse === undefined)
            return this.notFound();

        return this.ok<GuildTriggerTag>(autoresponse);
    }

    public async editAutoresponse(guildId: string, id: string, body: unknown, userId: string): Promise<ApiResponse> {
        const request = await this.mapRequestValue(body, mapUpdate);
        const key = await this.mapRequestValue(id, mapId);
        const autoresponse = await this.#api.database.guilds.getAutoresponse(guildId, key);
        if (autoresponse === undefined)
            return this.notFound();

        const result = { ...autoresponse, content: request.content, author: userId };
        if (!await this.#api.database.guilds.setAutoresponse(guildId, key, result))
            return this.internalServerError('Failed to update autoresponse');

        return this.ok(result);
    }

    async #checkAccess(guildId: string, userId: string | undefined): Promise<ApiResponse | undefined> {
        if (userId === undefined)
            return this.unauthorized();

        const perms = await this.#api.worker.request('getGuildPermission', { userId, guildId });
        if (perms === undefined)
            return this.notFound();

        if (!perms.autoresponses)
            return this.forbidden(`You cannot edit autoresponses on guild ${guildId}`);

        return undefined;
    }
}

const mapUpdate = z.compile(z.object({
    content: z.string()
}));

const mapId = z.compile(z.union([
    z.enum(['everything']),
    z.string().regex(/^\d+$/).transform(Number)
]));
