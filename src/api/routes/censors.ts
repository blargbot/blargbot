import { Api } from '../Api';
import { BaseRoute } from '../BaseRoute';
import { ApiResponse } from '../types';

export class CensorsRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/guilds');

        this.addRoute('/:guildId/censors', {
            get: (req) => this.listCensors(req.params.guildId, this.getUserId(req))
        });
    }

    public async listCensors(guildId: string, userId: string | undefined): Promise<ApiResponse> {
        if (userId === undefined)
            return this.unauthorized();

        const censors = await this.api.database.guilds.getCensors(guildId);
        if (censors === undefined)
            return this.notFound();

        return this.ok(censors);
    }
}
