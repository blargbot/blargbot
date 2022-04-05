import { Api } from '../Api';
import { BaseRoute } from '../BaseRoute';
import { ApiResponse } from '../types';

export class RolemesRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/guilds');

        this.addRoute('/:guildId/rolemes', {
            get: (req) => this.listRolemes(req.params.guildId, this.getUserId(req))
        });
    }

    public async listRolemes(guildId: string, userId: string | undefined): Promise<ApiResponse> {
        if (userId === undefined)
            return this.unauthorized();

        const rolemes = await this.api.database.guilds.getRolemes(guildId);
        if (rolemes === undefined)
            return this.notFound();

        return this.ok(rolemes);
    }
}
