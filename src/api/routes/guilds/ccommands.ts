import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { GuildCommandTag, NamedGuildSourceCommandTag } from '@blargbot/domain/models';
import { mapping } from '@blargbot/mapping';

export class CCommandsRoute extends BaseRoute {
    public constructor() {
        super('/guilds');

        this.middleware.push(async (ctx, next) => await this.#checkAccess(ctx.api, ctx.request.params.guildId, this.getUserId(ctx.request, true)) ?? await next());

        this.addRoute('/:guildId/ccommands', {
            get: ({ request, api }) => this.listCCommands(api, request.params.guildId),
            post: ({ request, api }) => this.createCommand(api, request.params.guildId, request.body, this.getUserId(request))
        });

        this.addRoute('/:guildId/ccommands/:commandName', {
            get: ({ request, api }) => this.getCommand(api, request.params.guildId, request.params.commandName),
            delete: ({ request, api }) => this.deleteCommand(api, request.params.guildId, request.params.commandName),
            put: ({ request, api }) => this.setCommand(api, request.params.guildId, request.params.commandName, request.body, this.getUserId(request)),
            patch: ({ request, api }) => this.editCommand(api, request.params.guildId, request.params.commandName, request.body, this.getUserId(request))
        });
    }

    public async listCCommands(api: Api, guildId: string): Promise<ApiResponse> {
        const ccommands = await api.database.guilds.getCustomCommandNames(guildId);
        return this.ok(ccommands);
    }

    public async getCommand(api: Api, guildId: string, commandName: string): Promise<ApiResponse> {
        const command = await api.database.guilds.getCommand(guildId, commandName);
        if (command === undefined)
            return this.notFound();

        return this.ok(command);
    }

    public async setCommand(api: Api, guildId: string, commandName: string, body: unknown, author: string): Promise<ApiResponse> {
        const mapped = mapUpdateCommand(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await api.database.guilds.getCommand(guildId, commandName);
        if (current === undefined)
            return await this.#createCommand(api, guildId, commandName, mapped.value.content ?? '', author);
        return await this.#editCommand(api, guildId, commandName, mapped.value, author, current);
    }

    public async createCommand(api: Api, guildId: string, body: unknown, author: string): Promise<ApiResponse> {
        const mapped = mapCreateCommand(body);
        if (!mapped.valid)
            return this.badRequest();

        const { name: commandName, content } = mapped.value;

        const current = await api.database.guilds.getCommand(guildId, commandName);
        if (current !== undefined)
            return this.forbidden(`A custom command with the name ${commandName} already exists`);

        return await this.#createCommand(api, guildId, commandName, content, author);
    }

    async #createCommand(api: Api, guildId: string, commandName: string, content: string, author: string): Promise<ApiResponse> {
        const success = await api.database.guilds.setCommand(guildId, commandName, { content, author });
        if (!success)
            return this.internalServerError('Failed to create custom command');

        return this.created({ name: commandName, content, author });
    }

    public async editCommand(api: Api, guildId: string, commandName: string, body: unknown, author: string): Promise<ApiResponse> {
        const mapped = mapUpdateCommand(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await api.database.guilds.getCommand(guildId, commandName);
        if (current === undefined)
            return this.forbidden(`There is no custom command with the name ${commandName}`);

        return await this.#editCommand(api, guildId, commandName, mapped.value, author, current);
    }

    async #editCommand(api: Api, guildId: string, commandName: string, update: Partial<NamedGuildSourceCommandTag>, author: string, current: GuildCommandTag): Promise<ApiResponse> {
        if ('alias' in current)
            return this.forbidden(`Custom command ${commandName} is an imported tag and cannot be edited`);

        let success = false;
        const command = { ...update, author };
        if (command.name !== undefined && command.name !== commandName) {
            if (!await api.database.guilds.renameCommand(guildId, commandName, command.name))
                return this.badRequest(`A custom command with the name ${command.name} already exists`);
            commandName = command.name;
            success = true;
        }

        delete command.name;

        success = await api.database.guilds.updateCommand(guildId, commandName, command) || success;
        if (!success)
            return this.internalServerError('Failed to update custom command');

        const newCommand = await api.database.guilds.getCommand(guildId, commandName);
        if (newCommand === undefined)
            return this.notFound();

        return this.ok(newCommand);
    }

    public async deleteCommand(api: Api, guildId: string, commandName: string): Promise<ApiResponse> {
        const success = await api.database.guilds.setCommand(guildId, commandName, undefined);
        if (!success)
            return this.notFound();

        return this.noContent();
    }

    async #checkAccess(api: Api, guildId: string, userId: string | undefined): Promise<ApiResponse | undefined> {
        if (userId === undefined)
            return this.unauthorized();

        const perms = await api.worker.request('getGuildPermission', { userId, guildId });
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
