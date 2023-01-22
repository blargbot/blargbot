import { Api } from '@blargbot/api/Api';
import { mapping } from '@blargbot/mapping';

import { BaseRoute } from '../../BaseRoute';
import { ApiResponse } from '../../types';

type CensorRuleType = 'timeout' | 'kick' | 'ban' | 'delete';

export class CensorsRoute extends BaseRoute<['/guilds/:guildId/censors']> {
    readonly #api: Api;

    public constructor(api: Api) {
        super('/guilds/:guildId/censors');

        this.#api = api;

        this.middleware.push(async (req, _, next) => await this.#checkAccess(req.params.guildId, this.getUserId(req, true)) ?? await next());

        this.addRoute('/', {
            get: ({ request }) => this.listCensors(request.params.guildId),
            post: ({ request }) => this.createCensor(request.params.guildId, request.body)
        });

        for (const type of ['delete', 'ban', 'kick'] as const) {
            this.addRoute(`/${type}Message`, {
                get: ({ request }) => this.getCensorDefaultMessage(request.params.guildId, type),
                put: ({ request }) => this.setCensorDefaultMessage(request.params.guildId, type, request.body, this.getUserId(request)),
                delete: ({ request }) => this.deleteCensorDefaultMessage(request.params.guildId, type)
            });

            this.addRoute(`/:id/${type}Message`, {
                get: ({ request }) => this.getCensorMessage(request.params.guildId, request.params.id, type),
                put: ({ request }) => this.setCensorMessage(request.params.guildId, request.params.id, type, request.body, this.getUserId(request)),
                delete: ({ request }) => this.deleteCensorMessage(request.params.guildId, request.params.id, type)
            });
        }

        this.addRoute('/:id', {
            get: ({ request }) => this.getCensor(request.params.guildId, request.params.id),
            delete: ({ request }) => this.deleteCensor(request.params.guildId, request.params.id),
            patch: ({ request }) => this.editCensor(request.params.guildId, request.params.id, request.body)
        });
    }

    public async createCensor(guildId: string, body: unknown): Promise<ApiResponse> {
        guildId;
        body;
        await Promise.resolve();
        return this.badRequest({ message: 'Creating censors via the API isnt supported yet!' });
    }

    public async getCensor(guildId: string, idStr: string): Promise<ApiResponse> {
        const id = this.mapRequestValue(idStr, mapping.number);
        const censor = await this.#api.database.guilds.getCensor(guildId, id);
        if (censor === undefined)
            return this.notFound();

        return this.ok(censor);
    }

    public async deleteCensor(guildId: string, idStr: string): Promise<ApiResponse> {
        const id = this.mapRequestValue(idStr, mapping.number);
        if (!await this.#api.database.guilds.setCensor(guildId, id, undefined))
            return this.notFound();

        return this.noContent();
    }

    public async editCensor(guildId: string, idStr: string, body: unknown): Promise<ApiResponse> {
        guildId;
        idStr;
        body;
        await Promise.resolve();
        return this.badRequest({ message: 'Editing censors via the API isnt supported yet!' });
    }

    public async getCensorDefaultMessage(guildId: string, type: CensorRuleType): Promise<ApiResponse> {
        const censors = await this.#api.database.guilds.getCensors(guildId);
        const result = censors?.rule?.[`${type}Message`];
        if (result === undefined)
            return this.notFound();

        return this.ok(result);
    }

    public async setCensorDefaultMessage(guildId: string, type: CensorRuleType, body: unknown, userId: string): Promise<ApiResponse> {
        const request = this.mapRequestValue(body, mapTag);
        const current = await this.#api.database.guilds.getCensorRule(guildId, undefined, type);
        const result = { ...current, ...request, author: userId };
        if (!await this.#api.database.guilds.setCensorRule(guildId, undefined, type, result))
            return this.internalServerError('Failed to update record');

        return this.ok(result);
    }

    public async deleteCensorDefaultMessage(guildId: string, type: CensorRuleType): Promise<ApiResponse> {
        await this.#api.database.guilds.setCensorRule(guildId, undefined, type, undefined);
        return this.noContent();
    }

    public async getCensorMessage(guildId: string, idStr: string, type: CensorRuleType): Promise<ApiResponse> {
        const id = this.mapRequestValue(idStr, mapping.number);
        const censor = await this.#api.database.guilds.getCensor(guildId, id);
        const result = censor?.[`${type}Message`];
        if (result === undefined)
            return this.notFound();

        return this.ok(result);
    }

    public async setCensorMessage(guildId: string, idStr: string, type: CensorRuleType, body: unknown, userId: string): Promise<ApiResponse> {
        const id = this.mapRequestValue(idStr, mapping.number);
        const request = this.mapRequestValue(body, mapTag);
        const current = await this.#api.database.guilds.getCensor(guildId, id);
        if (current === undefined)
            return this.notFound();

        const result = { ...current[`${type}Message`], ...request, author: userId };
        if (!await this.#api.database.guilds.setCensorRule(guildId, id, type, result))
            return this.internalServerError('Failed to update record');

        return this.ok(result);
    }

    public async deleteCensorMessage(guildId: string, idStr: string, type: CensorRuleType): Promise<ApiResponse> {
        const id = this.mapRequestValue(idStr, mapping.number);
        if (await this.#api.database.guilds.getCensor(guildId, id) === undefined)
            return this.notFound();

        await this.#api.database.guilds.setCensorRule(guildId, id, type, undefined);
        return this.noContent();
    }

    public async listCensors(guildId: string): Promise<ApiResponse> {
        const censors = await this.#api.database.guilds.getCensors(guildId);
        if (censors === undefined)
            return this.notFound();

        return this.ok(censors);
    }

    async #checkAccess(guildId: string, userId: string | undefined): Promise<ApiResponse | undefined> {
        if (userId === undefined)
            return this.unauthorized();

        const perms = await this.#api.worker.request('getGuildPermission', { userId, guildId });
        if (perms === undefined)
            return this.notFound();

        if (!perms.censors)
            return this.forbidden(`You cannot edit censors on guild ${guildId}`);

        return undefined;
    }
}

const mapTag = mapping.object({
    content: mapping.string
});
