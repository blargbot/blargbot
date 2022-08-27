import { Api } from '@blargbot/api/Api';
import { parse } from '@blargbot/core/utils';
import { mapping } from '@blargbot/mapping';

import { BaseRoute } from '../../BaseRoute';
import { ApiResponse } from '../../types';

type CensorRuleType = 'timeout' | 'kick' | 'ban' | 'delete';

export class CensorsRoute extends BaseRoute {
    public constructor() {
        super('/guilds');

        this.middleware.push(async (ctx, next) => await this.#checkAccess(ctx.api, ctx.request.params.guildId, this.getUserId(ctx.request, true)) ?? await next());

        this.addRoute('/:guildId/censors', {
            get: ({ request, api }) => this.listCensors(api, request.params.guildId)
        });

        for (const type of ['delete', 'ban', 'kick'] as const) {
            this.addRoute(`/:guildId/censors/${type}Message`, {
                get: ({ request, api }) => this.getCensorDefaultMessage(api, request.params.guildId, type),
                put: ({ request, api }) => this.setCensorDefaultMessage(api, request.params.guildId, type, request.body, this.getUserId(request)),
                delete: ({ request, api }) => this.deleteCensorDefaultMessage(api, request.params.guildId, type)
            });

            this.addRoute(`/:guildId/censors/:id/${type}Message`, {
                get: ({ request, api }) => this.getCensorMessage(api, request.params.guildId, request.params.id, type),
                put: ({ request, api }) => this.setCensorMessage(api, request.params.guildId, request.params.id, type, request.body, this.getUserId(request)),
                delete: ({ request, api }) => this.deleteCensorMessage(api, request.params.guildId, request.params.id, type)
            });
        }
    }

    public async getCensorDefaultMessage(api: Api, guildId: string, type: CensorRuleType): Promise<ApiResponse> {
        const censors = await api.database.guilds.getCensors(guildId);
        const result = censors?.rule?.[`${type}Message`];
        if (result === undefined)
            return this.notFound();

        return this.ok(result);
    }

    public async setCensorDefaultMessage(api: Api, guildId: string, type: CensorRuleType, body: unknown, userId: string): Promise<ApiResponse> {
        const mapped = mapTag(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await api.database.guilds.getCensorRule(guildId, undefined, type);
        const result = { ...current, ...mapped.value, author: userId };
        if (!await api.database.guilds.setCensorRule(guildId, undefined, type, result))
            return this.internalServerError('Failed to update record');

        return this.ok(result);
    }

    public async deleteCensorDefaultMessage(api: Api, guildId: string, type: CensorRuleType): Promise<ApiResponse> {
        await api.database.guilds.setCensorRule(guildId, undefined, type, undefined);
        return this.noContent();
    }

    public async getCensorMessage(api: Api, guildId: string, idStr: string, type: CensorRuleType): Promise<ApiResponse> {
        const id = parse.int(idStr, { strict: true });
        if (id === undefined)
            return this.badRequest();

        const censor = await api.database.guilds.getCensor(guildId, id);
        const result = censor?.[`${type}Message`];
        if (result === undefined)
            return this.notFound();

        return this.ok(result);
    }

    public async setCensorMessage(api: Api, guildId: string, idStr: string, type: CensorRuleType, body: unknown, userId: string): Promise<ApiResponse> {
        const id = parse.int(idStr, { strict: true });
        if (id === undefined)
            return this.badRequest();

        const mapped = mapTag(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await api.database.guilds.getCensor(guildId, id);
        if (current === undefined)
            return this.notFound();

        const result = { ...current[`${type}Message`], ...mapped.value, author: userId };
        if (!await api.database.guilds.setCensorRule(guildId, id, type, result))
            return this.internalServerError('Failed to update record');

        return this.ok(result);
    }

    public async deleteCensorMessage(api: Api, guildId: string, idStr: string, type: CensorRuleType): Promise<ApiResponse> {
        const id = parse.int(idStr, { strict: true });
        if (id === undefined)
            return this.badRequest();

        if (await api.database.guilds.getCensor(guildId, id) === undefined)
            return this.notFound();

        await api.database.guilds.setCensorRule(guildId, id, type, undefined);
        return this.noContent();
    }

    public async listCensors(api: Api, guildId: string): Promise<ApiResponse> {
        const censors = await api.database.guilds.getCensors(guildId);
        if (censors === undefined)
            return this.notFound();

        return this.ok(censors);
    }

    async #checkAccess(api: Api, guildId: string, userId: string | undefined): Promise<ApiResponse | undefined> {
        if (userId === undefined)
            return this.unauthorized();

        const perms = await api.worker.request('getGuildPermission', { userId, guildId });
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
