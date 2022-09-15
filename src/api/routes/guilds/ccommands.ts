import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { GuildCommandTag, NamedGuildSourceCommandTag } from '@blargbot/domain/models';
import { mapping } from '@blargbot/mapping';

export class CCommandsRoute extends BaseRoute {
    readonly #api: Api;

    public constructor(api: Api) {
        super('/guilds');

        this.#api = api;

        this.middleware.push(async (req, _, next) => await this.#checkAccess(req.params.guildId, this.getUserId(req, true)) ?? await next());

        this.addRoute('/:guildId/ccommands', {
            get: ({ request }) => this.listCCommands(request.params.guildId),
            post: ({ request }) => this.createCommand(request.params.guildId, request.body, this.getUserId(request))
        });

        this.addRoute('/:guildId/ccommands/:commandName', {
            get: ({ request }) => this.getCommand(request.params.guildId, request.params.commandName),
            delete: ({ request }) => this.deleteCommand(request.params.guildId, request.params.commandName),
            put: ({ request }) => this.setCommand(request.params.guildId, request.params.commandName, request.body, this.getUserId(request)),
            patch: ({ request }) => this.editCommand(request.params.guildId, request.params.commandName, request.body, this.getUserId(request))
        });
    }

    public async listCCommands(guildId: string): Promise<ApiResponse> {
        const ccommands = await this.#api.database.guilds.getCustomCommandNames(guildId);
        return this.ok(ccommands);
    }

    public async getCommand(guildId: string, commandName: string): Promise<ApiResponse> {
        const command = await this.#api.database.guilds.getCommand(guildId, commandName);
        if (command === undefined)
            return this.notFound();

        return this.ok(command);
    }

    public async setCommand(guildId: string, commandName: string, body: unknown, author: string): Promise<ApiResponse> {
        const mapped = mapUpdateCommand(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await this.#api.database.guilds.getCommand(guildId, commandName);
        if (current === undefined)
            return await this.#createCommand(guildId, commandName, mapped.value.content ?? '', author);
        return await this.#editCommand(guildId, commandName, mapped.value, author, current);
    }

    public async createCommand(guildId: string, body: unknown, author: string): Promise<ApiResponse> {
        const mapped = mapCreateCommand(body);
        if (!mapped.valid)
            return this.badRequest();

        const { name: commandName, content } = mapped.value;

        const current = await this.#api.database.guilds.getCommand(guildId, commandName);
        if (current !== undefined)
            return this.forbidden(`A custom command with the name ${commandName} already exists`);

        return await this.#createCommand(guildId, commandName, content, author);
    }

    async #createCommand(guildId: string, commandName: string, content: string, author: string): Promise<ApiResponse> {
        if (commandName.length > 80)
            return this.badRequest('name cannot be longer than 80 characters');

        const success = await this.#api.database.guilds.setCommand(guildId, commandName, { content, author });
        if (!success)
            return this.internalServerError('Failed to create custom command');

        return this.created({ name: commandName, content, author });
    }

    public async editCommand(guildId: string, commandName: string, body: unknown, author: string): Promise<ApiResponse> {
        const mapped = mapUpdateCommand(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await this.#api.database.guilds.getCommand(guildId, commandName);
        if (current === undefined)
            return this.forbidden(`There is no custom command with the name ${commandName}`);

        return await this.#editCommand(guildId, commandName, mapped.value, author, current);
    }

    async #editCommand(guildId: string, commandName: string, update: Partial<NamedGuildSourceCommandTag>, author: string, current: GuildCommandTag): Promise<ApiResponse> {
        if ('alias' in current)
            return this.forbidden(`Custom command ${commandName} is an imported tag and cannot be edited`);

        let success = false;
        const command = { ...update, author };
        if (command.name !== undefined && command.name !== commandName) {
            if (!await this.#api.database.guilds.renameCommand(guildId, commandName, command.name))
                return this.badRequest(`A custom command with the name ${command.name} already exists`);
            commandName = command.name;
            success = true;
        }

        delete command.name;

        success = await this.#api.database.guilds.updateCommand(guildId, commandName, command) || success;
        if (!success)
            return this.internalServerError('Failed to update custom command');

        const newCommand = await this.#api.database.guilds.getCommand(guildId, commandName);
        if (newCommand === undefined)
            return this.notFound();

        return this.ok(newCommand);
    }

    public async deleteCommand(guildId: string, commandName: string): Promise<ApiResponse> {
        const success = await this.#api.database.guilds.setCommand(guildId, commandName, undefined);
        if (!success)
            return this.notFound();

        return this.noContent();
    }

    async #checkAccess(guildId: string, userId: string | undefined): Promise<ApiResponse | undefined> {
        if (userId === undefined)
            return this.unauthorized();

        const perms = await this.#api.worker.request('getGuildPermission', { userId, guildId });
        if (perms === undefined)
            return this.notFound();

        if (!perms.ccommands)
            return this.forbidden(`You cannot edit custom commands on guild ${guildId}`);

        return undefined;
    }
}

const mapCreateCommand = mapping.object({
    content: mapping.string,
    name: mapping.string
});

const mapUpdateCommand = mapping.object({
    content: mapping.string.optional,
    name: mapping.string.optional
});
