import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { GuildSourceCommandTag, NamedGuildSourceCommandTag } from '@blargbot/core/types';
import { mapping } from '@blargbot/mapping';

export class CCommandsRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/guilds');

        this.addRoute('/:guildId/ccommands', {
            get: (req) => this.listCCommands(req.params.guildId, this.getUserId(req)),
            post: (req) => this.createCommand(req.params.guildId, req.body, this.getUserId(req))
        });
        this.addRoute('/:guildId/ccommands/:commandName', {
            get: (req) => this.getCommand(req.params.guildId, req.params.commandName, this.getUserId(req)),
            delete: (req) => this.deleteCommand(req.params.guildId, req.params.commandName, this.getUserId(req)),
            put: (req) => this.editCommand(req.params.guildId, req.params.commandName, req.body, this.getUserId(req))
        });
    }

    public async listCCommands(guildId: string, userId: string | undefined): Promise<ApiResponse> {
        if (userId === undefined)
            return this.badRequest();

        const member = await this.api.util.getMember(guildId, userId);
        if (member === undefined)
            return this.notFound();

        const ccommands = await this.api.database.guilds.getCustomCommandNames(guildId);
        return this.ok(ccommands);
    }

    public async getCommand(guildId: string, commandName: string, userId: string | undefined): Promise<ApiResponse> {
        const error = await this.checkCCommandAccess(guildId, userId);
        if (error !== undefined)
            return error;

        const command = await this.api.database.guilds.getCommand(guildId, commandName);
        if (command === undefined)
            return this.notFound();

        return this.ok(command);
    }

    public async createCommand(guildId: string, body: unknown, author: string | undefined): Promise<ApiResponse> {
        if (author === undefined)
            return this.badRequest();

        const error = await this.checkCCommandAccess(guildId, author);
        if (error !== undefined)
            return error;

        const mapped = mapCreateCommand(body);
        if (!mapped.valid)
            return this.badRequest();

        const { name: commandName, ...rest } = mapped.value;

        const command: Mutable<GuildSourceCommandTag> = {
            ...rest,
            author
        };

        const exists = await this.api.database.guilds.getCommand(guildId, commandName);
        if (exists !== undefined)
            return this.forbidden(`A custom command with the name ${commandName} already exists`);

        const success = await this.api.database.guilds.setCommand(guildId, commandName, command);
        if (!success)
            return this.internalServerError('Failed to create custom command');

        return this.created({ ...command, name: commandName });
    }

    public async editCommand(guildId: string, commandName: string, body: unknown, author: string | undefined): Promise<ApiResponse> {
        if (author === undefined)
            return this.badRequest();

        const error = await this.checkCCommandAccess(guildId, author);
        if (error !== undefined)
            return error;

        const mapped = mapUpdateCommand(body);
        if (!mapped.valid)
            return this.badRequest();

        const exists = await this.api.database.guilds.getCommand(guildId, commandName);
        if (exists === undefined)
            return this.forbidden(`There is no custom command with the name ${commandName}`);
        if ('alias' in exists)
            return this.forbidden(`Custom command ${commandName} is an imported tag and cannot be edited`);

        const command: Partial<Mutable<NamedGuildSourceCommandTag>> = {
            ...mapped.value,
            author
        };

        if (command.name !== undefined && command.name !== commandName) {
            if (!await this.api.database.guilds.renameCommand(guildId, commandName, command.name))
                return this.badRequest(`A custom command with the name ${command.name} already exists`);
            commandName = command.name;
        }

        delete command.name;

        const success = await this.api.database.guilds.updateCommand(guildId, commandName, command);
        if (!success)
            return this.internalServerError('Failed to update custom command');

        return this.ok(await this.api.database.guilds.getCommand(guildId, commandName));
    }

    public async deleteCommand(guildId: string, commandName: string, author: string | undefined): Promise<ApiResponse> {
        const error = await this.checkCCommandAccess(guildId, author);
        if (error !== undefined)
            return error;

        const success = await this.api.database.guilds.setCommand(guildId, commandName, undefined);
        if (!success)
            return this.notFound();

        return this.noContent();
    }

    private async checkCCommandAccess(guildId: string, userId: string | undefined): Promise<ApiResponse | undefined> {
        if (userId === undefined)
            return this.badRequest();

        const perms = await this.api.worker.request('getGuildPermission', { userId, guildId });
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
