import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { parse } from '@blargbot/core/utils';
import { GuildTriggerTag } from '@blargbot/domain/models';
import { mapping } from '@blargbot/mapping';

export class AutoresponsesRoute extends BaseRoute {
    public constructor() {
        super('/guilds');

        this.middleware.push(async (ctx, next) => await this.#checkAccess(ctx.api, ctx.request.params.guildId, this.getUserId(ctx.request, true)) ?? await next());

        this.addRoute('/:guildId/autoresponses', {
            get: ({ request, api }) => this.listAutoresponses(api, request.params.guildId)
        });

        this.addRoute('/:guildId/autoresponses/:id', {
            get: ({ request, api }) => this.getAutoresponse(api, request.params.guildId, request.params.id),
            patch: ({ request, api }) => this.editAutoresponse(api, request.params.guildId, request.params.id, request.body, this.getUserId(request))
        });
    }

    public async listAutoresponses(api: Api, guildId: string): Promise<ApiResponse> {
        const autoresponses = await api.database.guilds.getAutoresponses(guildId);
        if (autoresponses === undefined)
            return this.notFound();

        return this.ok(autoresponses);
    }

    public async getAutoresponse(api: Api, guildId: string, id: string): Promise<ApiResponse> {
        const key = id === 'everything' ? id : parse.int(id, { strict: true });
        if (key === undefined)
            return this.badRequest();

        const autoresponse = await api.database.guilds.getAutoresponse(guildId, key);
        if (autoresponse === undefined)
            return this.notFound();

        return this.ok<GuildTriggerTag>(autoresponse);
    }

    public async editAutoresponse(api: Api, guildId: string, id: string, body: unknown, userId: string): Promise<ApiResponse> {
        const mapped = mapUpdate(body);
        const key = id === 'everything' ? id : parse.int(id, { strict: true });
        if (key === undefined || !mapped.valid)
            return this.badRequest();

        const autoresponse = await api.database.guilds.getAutoresponse(guildId, key);
        if (autoresponse === undefined)
            return this.notFound();

        const result = { ...autoresponse, content: mapped.value.content, author: userId };
        if (!await api.database.guilds.setAutoresponse(guildId, key, result))
            return this.internalServerError('Failed to update autoresponse');

        return this.ok(result);
    }

    async #checkAccess(api: Api, guildId: string, userId: string | undefined): Promise<ApiResponse | undefined> {
        if (userId === undefined)
            return this.unauthorized();

        const perms = await api.worker.request('getGuildPermission', { userId, guildId });
        if (perms === undefined)
            return this.notFound();

        if (!perms.autoresponses)
            return this.forbidden(`You cannot edit autoresponses on guild ${guildId}`);

        return undefined;
    }
}

const mapUpdate = mapping.object({
    content: mapping.string
});
