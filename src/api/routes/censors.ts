import { parse } from '@blargbot/core/utils';
import { mapping } from '@blargbot/mapping';

import { Api } from '../Api';
import { BaseRoute } from '../BaseRoute';
import { ApiResponse } from '../types';

type CensorRuleType = 'kick' | 'ban' | 'delete';

export class CensorsRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/guilds');

        this.middleware.push(async (req, _, next) => await this.checkAccess(req.params.guildId, this.getUserId(req)) ?? await next());

        this.addRoute('/:guildId/censors', {
            get: (req) => this.listCensors(req.params.guildId)
        });

        for (const type of ['delete', 'ban', 'kick'] as const) {
            this.addRoute(`/:guildId/censors/${type}Message`, {
                get: (req) => this.getCensorDefaultMessage(req.params.guildId, type),
                put: (req) => this.setCensorDefaultMessage(req.params.guildId, type, req.body, this.getUserId(req, false)),
                delete: (req) => this.deleteCensorDefaultMessage(req.params.guildId, type)
            });

            this.addRoute(`/:guildId/censors/:id/${type}Message`, {
                get: (req) => this.getCensorMessage(req.params.guildId, req.params.id, type),
                put: (req) => this.setCensorMessage(req.params.guildId, req.params.id, type, req.body, this.getUserId(req, false)),
                delete: (req) => this.deleteCensorMessage(req.params.guildId, req.params.id, type)
            });
        }
    }

    public async getCensorDefaultMessage(guildId: string, type: CensorRuleType): Promise<ApiResponse> {
        const censors = await this.api.database.guilds.getCensors(guildId);
        const result = censors?.rule?.[`${type}Message`];
        return this.ok(result);
    }

    public async setCensorDefaultMessage(guildId: string, type: CensorRuleType, body: unknown, userId: string): Promise<ApiResponse> {
        const mapped = mapTag(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await this.api.database.guilds.getCensorRule(guildId, undefined, type);
        const result = { ...current, ...mapped.value, author: userId };
        if (!await this.api.database.guilds.setCensorRule(guildId, undefined, type, result))
            return this.internalServerError('Failed to update record');

        return this.ok(result);
    }

    public async deleteCensorDefaultMessage(guildId: string, type: CensorRuleType): Promise<ApiResponse> {
        await this.api.database.guilds.setCensorRule(guildId, undefined, type, undefined);
        return this.noContent();
    }

    public async getCensorMessage(guildId: string, idStr: string, type: CensorRuleType): Promise<ApiResponse> {
        const id = parse.int(idStr, false);
        if (id === undefined)
            return this.badRequest();

        const censor = await this.api.database.guilds.getCensor(guildId, id);
        const result = censor?.[`${type}Message`];
        if (result === undefined)
            return this.notFound();

        return this.ok(result);
    }

    public async setCensorMessage(guildId: string, idStr: string, type: CensorRuleType, body: unknown, userId: string): Promise<ApiResponse> {
        const id = parse.int(idStr, false);
        if (id === undefined)
            return this.badRequest();

        const mapped = mapTag(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await this.api.database.guilds.getCensor(guildId, id);
        if (current === undefined)
            return this.notFound();

        const result = { ...current[`${type}Message`], ...mapped.value, author: userId };
        if (!await this.api.database.guilds.setCensorRule(guildId, id, type, result))
            return this.internalServerError('Failed to update record');

        return this.ok(result);
    }

    public async deleteCensorMessage(guildId: string, idStr: string, type: CensorRuleType): Promise<ApiResponse> {
        const id = parse.int(idStr, false);
        if (id === undefined)
            return this.badRequest();

        if (await this.api.database.guilds.getCensor(guildId, id) === undefined)
            return this.notFound();

        await this.api.database.guilds.setCensorRule(guildId, id, type, undefined);
        return this.noContent();
    }

    public async listCensors(guildId: string): Promise<ApiResponse> {
        const censors = await this.api.database.guilds.getCensors(guildId);
        if (censors === undefined)
            return this.notFound();

        return this.ok(censors);
    }

    private async checkAccess(guildId: string, userId: string | undefined): Promise<ApiResponse | undefined> {
        if (userId === undefined)
            return this.unauthorized();

        const perms = await this.api.worker.request('getGuildPermission', { userId, guildId });
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
