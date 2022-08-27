import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { parse } from '@blargbot/core/utils';
import { mapping } from '@blargbot/mapping';

export class RolemesRoute extends BaseRoute {
    public constructor() {
        super('/guilds');

        this.middleware.push(async (ctx, next) => await this.#checkAccess(ctx.api, ctx.request.params.guildId, this.getUserId(ctx.request, true)) ?? await next());

        this.addRoute('/:guildId/rolemes', {
            get: ({ request, api }) => this.listRolemes(api, request.params.guildId)
        });

        this.addRoute('/:guildId/rolemes/:id/output', {
            get: ({ request, api }) => this.getRoleme(api, request.params.guildId, request.params.id),
            put: ({ request, api }) => this.setRoleme(api, request.params.guildId, request.params.id, request.body, this.getUserId(request)),
            delete: ({ request, api }) => this.deleteRoleme(api, request.params.guildId, request.params.id)
        });
    }

    public async getRoleme(api: Api, guildId: string, idStr: string): Promise<ApiResponse> {
        const id = parse.int(idStr, { strict: true });
        if (id === undefined)
            return this.badRequest();

        const roleme = await api.database.guilds.getRoleme(guildId, id);
        if (roleme?.output === undefined)
            return this.notFound();

        return this.ok(roleme.output);
    }

    public async setRoleme(api: Api, guildId: string, idStr: string, body: unknown, userId: string): Promise<ApiResponse> {
        const id = parse.int(idStr, { strict: true });
        if (id === undefined)
            return this.badRequest();

        const mapped = mapTag(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await api.database.guilds.getRoleme(guildId, id);
        if (current === undefined)
            return this.notFound();

        const result = { ...current, output: { ...current.output, ...mapped.value, author: userId } };
        if (!await api.database.guilds.setRoleme(guildId, id, result))
            return this.internalServerError('Failed to save changes');

        return this.ok(result.output);
    }

    public async deleteRoleme(api: Api, guildId: string, idStr: string): Promise<ApiResponse> {
        const id = parse.int(idStr, { strict: true });
        if (id === undefined)
            return this.badRequest();

        const current = await api.database.guilds.getRoleme(guildId, id);
        if (current === undefined)
            return this.notFound();

        const result = { ...current, output: undefined };
        await api.database.guilds.setRoleme(guildId, id, result);
        return this.noContent();
    }

    public async listRolemes(api: Api, guildId: string): Promise<ApiResponse> {
        const rolemes = await api.database.guilds.getRolemes(guildId);
        if (rolemes === undefined)
            return this.notFound();

        return this.ok(rolemes);
    }

    async #checkAccess(api: Api, guildId: string, userId: string | undefined): Promise<ApiResponse | undefined> {
        if (userId === undefined)
            return this.unauthorized();

        const perms = await api.worker.request('getGuildPermission', { userId, guildId });
        if (perms === undefined)
            return this.notFound();

        if (!perms.rolemes)
            return this.forbidden(`You cannot edit rolemes on guild ${guildId}`);

        return undefined;
    }
}

const mapTag = mapping.object({
    content: mapping.string
});
