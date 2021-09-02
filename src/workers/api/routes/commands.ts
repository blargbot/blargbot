import { Api } from '@api';
import { BaseRoute } from '@api/BaseRoute';
import { ApiResponse } from '@api/types';
import { CommandDetails, CommandListResult } from '@cluster/types';

export class CommandsRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/commands');

        this.addRoute('/', {
            get: () => this.listCommands()
        }).addRoute('/:commandName', {
            get: (req) => this.getCommand(req.params.commandName)
        });
    }

    public async listCommands(): Promise<ApiResponse> {
        const subtags = await this.api.worker.request<undefined, CommandListResult>('getCommandList', undefined);
        return this.ok(subtags);
    }

    public async getCommand(name: string): Promise<ApiResponse> {
        const subtag = await this.api.worker.request<string, CommandDetails | undefined>('getCommand', name);
        if (subtag === undefined)
            return this.notFound();
        return this.ok(subtag);
    }
}
