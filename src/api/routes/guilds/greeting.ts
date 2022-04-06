import { Api } from '@blargbot/api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { mapping } from '@blargbot/mapping';

export class GreetingRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/guilds');

        this.middleware.push(async (req, _, next) => await this.checkAccess(req.params.guildId, this.getUserId(req, true)) ?? await next());

        this.addRoute('/:guildId/greeting', {
            get: (req) => this.getGreeting(req.params.guildId),
            put: (req) => this.setGreeting(req.params.guildId, req.body, this.getUserId(req)),
            delete: (req) => this.deleteGreeting(req.params.guildId)
        });
    }

    public async getGreeting(guildId: string): Promise<ApiResponse> {
        const greeting = await this.api.database.guilds.getGreeting(guildId);
        if (greeting === undefined)
            return this.notFound();
        return this.ok(greeting);
    }

    public async setGreeting(guildId: string, body: unknown, userId: string): Promise<ApiResponse> {
        const mapped = mapTag(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await this.api.database.guilds.getGreeting(guildId);
        const result = { ...current, ...mapped.value, author: userId };
        if (!await this.api.database.guilds.setGreeting(guildId, result))
            return this.internalServerError('Failed to set greeting');
        return this.ok(result);
    }

    public async deleteGreeting(guildId: string): Promise<ApiResponse> {
        await this.api.database.guilds.setGreeting(guildId, undefined);
        return this.noContent();
    }

    private async checkAccess(guildId: string, userId: string | undefined): Promise<ApiResponse | undefined> {
        if (userId === undefined)
            return this.unauthorized();

        const perms = await this.api.worker.request('getGuildPermission', { userId, guildId });
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
