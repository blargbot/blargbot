import type { Api } from '../Api.js';
import { BaseRoute } from '../BaseRoute.js';
import type { ApiResponse } from '../types.js';

export class CommandsRoute extends BaseRoute<['/commands']> {
    readonly #api: Api;

    public constructor(api: Api) {
        super('/commands');

        this.#api = api;

        this.addRoute('/', {
            get: () => this.listCommands()
        }).addRoute('/:commandName', {
            get: ({ request }) => this.getCommand(request.params.commandName)
        });
    }

    public async listCommands(): Promise<ApiResponse> {
        const commands = await this.#api.worker.request('getCommandList', undefined);
        return this.ok(commands);
    }

    public async getCommand(name: string): Promise<ApiResponse> {
        const command = await this.#api.worker.request('getCommand', name);
        if (command === undefined)
            return this.notFound();
        return this.ok(command);
    }

}
