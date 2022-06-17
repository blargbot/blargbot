import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { parse } from '@blargbot/core/utils';
import { GuildTriggerTag } from '@blargbot/domain/models';
import { mapping } from '@blargbot/mapping';

export class AutoresponsesRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/guilds');

        this.middleware.push(async (req, _, next) => await this.checkAccess(req.params.guildId, this.getUserId(req, true)) ?? await next());

        this.addRoute('/:guildId/autoresponses', {
            get: ({ request }) => this.listAutoresponses(request.params.guildId)
        });

        this.addRoute('/:guildId/autoresponses/:id', {
            get: ({ request }) => this.getAutoresponse(request.params.guildId, request.params.id),
            patch: ({ request }) => this.editAutoresponse(request.params.guildId, request.params.id, request.body, this.getUserId(request))
        });
    }

    public async listAutoresponses(guildId: string): Promise<ApiResponse> {
        const autoresponses = await this.api.database.guilds.getAutoresponses(guildId);
        if (autoresponses === undefined)
            return this.notFound();

        return this.ok(autoresponses);
    }

    public async getAutoresponse(guildId: string, id: string): Promise<ApiResponse> {
        const key = id === 'everything' ? id : parse.int(id, { strict: true });
        if (key === undefined)
            return this.badRequest();

        const autoresponse = await this.api.database.guilds.getAutoresponse(guildId, key);
        if (autoresponse === undefined)
            return this.notFound();

        return this.ok<GuildTriggerTag>(autoresponse);
    }

    public async editAutoresponse(guildId: string, id: string, body: unknown, userId: string): Promise<ApiResponse> {
        const mapped = mapUpdate(body);
        const key = id === 'everything' ? id : parse.int(id, { strict: true });
        if (key === undefined || !mapped.valid)
            return this.badRequest();

        const autoresponse = await this.api.database.guilds.getAutoresponse(guildId, key);
        if (autoresponse === undefined)
            return this.notFound();

        const result = { ...autoresponse, content: mapped.value.content, author: userId };
        if (!await this.api.database.guilds.setAutoresponse(guildId, key, result))
            return this.internalServerError('Failed to update autoresponse');

        return this.ok(result);
    }

    private async checkAccess(guildId: string, userId: string | undefined): Promise<ApiResponse | undefined> {
        if (userId === undefined)
            return this.unauthorized();

        const perms = await this.api.worker.request('getGuildPermission', { userId, guildId });
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
