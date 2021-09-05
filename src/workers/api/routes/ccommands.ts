import { Api } from '@api/Api';
import { BaseRoute } from '@api/BaseRoute';
import { ApiResponse } from '@api/types';

export class CCommandsRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/guilds/');

        this.addRoute('/:guildId/ccommands', {
            get: (req) => this.listCCommands(req.params.guildId, this.getUserId(req))
        });
    }

    public async listCCommands(guildId: string, userId: string | undefined): Promise<ApiResponse> {
        if (userId === undefined)
            return this.forbidden();

        const member = await this.api.util.getMember(guildId, userId);
        if (member === undefined)
            return this.notFound();

        const ccommands = await this.api.database.guilds.getCustomCommandNames(guildId);
        return this.ok(ccommands);
    }
}
