import { Api } from '../Api';
import { BaseRoute } from '../BaseRoute';
import { ApiResponse } from '../types';

export class AutoresponsesRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/guilds');

        this.addRoute('/:guildId/autoresponses', {
            get: (req) => this.listAutoresponses(req.params.guildId, this.getUserId(req))
        });
    }

    public async listAutoresponses(guildId: string, userId: string | undefined): Promise<ApiResponse> {
        if (userId === undefined)
            return this.unauthorized();

        const autoresponses = await this.api.database.guilds.getAutoresponses(guildId);
        if (autoresponses === undefined)
            return this.notFound();

        return this.ok(autoresponses);
    }
}
