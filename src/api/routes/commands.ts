import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';

export class CommandsRoute extends BaseRoute {
    public constructor() {
        super('/commands');

        this.addRoute('/', {
            get: ({ api }) => this.listCommands(api)
        }).addRoute('/:commandName', {
            get: ({ request, api }) => this.getCommand(api, request.params.commandName)
        });
    }

    public async listCommands(api: Api): Promise<ApiResponse> {
        const commands = await api.worker.request('getCommandList', undefined);
        return this.ok(commands);
    }

    public async getCommand(api: Api, name: string): Promise<ApiResponse> {
        const command = await api.worker.request('getCommand', name);
        if (command === undefined)
            return this.notFound();
        return this.ok(command);
    }

}
