import { mapping } from '@blargbot/mapping';

import { Api } from '../Api';
import { BaseRoute } from '../BaseRoute';
import { ApiResponse } from '../types';

export class IntervalRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/guilds');

        this.middleware.push(async (req, _, next) => await this.checkAccess(req.params.guildId, this.getUserId(req)) ?? await next());

        this.addRoute('/:guildId/interval', {
            get: (req) => this.getInterval(req.params.guildId),
            put: (req) => this.setInterval(req.params.guildId, req.body, this.getUserId(req, false)),
            delete: (req) => this.deleteInterval(req.params.guildId)
        });
    }

    public async getInterval(guildId: string): Promise<ApiResponse> {
        const interval = await this.api.database.guilds.getInterval(guildId);
        if (interval === undefined)
            return this.notFound();
        return this.ok(interval);
    }

    public async setInterval(guildId: string, body: unknown, userId: string): Promise<ApiResponse> {
        const mapped = mapTag(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await this.api.database.guilds.getInterval(guildId);
        const result = { ...current, ...mapped.value, author: userId };
        if (!await this.api.database.guilds.setInterval(guildId, result))
            return this.internalServerError('Failed to set interval');
        return this.ok(result);
    }

    public async deleteInterval(guildId: string): Promise<ApiResponse> {
        await this.api.database.guilds.setInterval(guildId, undefined);
        return this.noContent();
    }

    private async checkAccess(guildId: string, userId: string | undefined): Promise<ApiResponse | undefined> {
        if (userId === undefined)
            return this.unauthorized();

        const perms = await this.api.worker.request('getGuildPermission', { userId, guildId });
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
