import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';

export class CommandsRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/commands');

        this.addRoute('/', {
            get: () => this.listCommands()
        }).addRoute('/:commandName', {
            get: ({ request }) => this.getCommand(request.params.commandName)
        });
    }

    public async listCommands(): Promise<ApiResponse> {
        const commands = await this.api.worker.request('getCommandList', undefined);
        return this.ok(commands);
    }

    public async getCommand(name: string): Promise<ApiResponse> {
        const command = await this.api.worker.request('getCommand', name);
        if (command === undefined)
            return this.notFound();
        return this.ok(command);
    }

}
