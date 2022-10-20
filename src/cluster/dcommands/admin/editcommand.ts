import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext, ICommand } from '@blargbot/cluster/types';
import { CommandType } from '@blargbot/cluster/utils';
import { CommandPermissions } from '@blargbot/domain/models';
import { Role } from 'eris';

import templates from '../../text';

const cmd = templates.commands.editCommand;

export class EditCommandCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'editcommand',
            category: CommandType.ADMIN,
            cannotDisable: true,
            definitions: [
                {
                    parameters: 'list',
                    description: cmd.list.description,
                    execute: (ctx) => this.list(ctx)
                },
                {
                    parameters: '{commands[]} setrole {roles:role[0]}',
                    description: cmd.setRole.description,
                    execute: (ctx, [commands, roles]) => this.setRole(ctx, commands.asStrings, roles.asRoles)
                },
                {
                    parameters: '{commands[]} setperm|setperms {permission:bigint?}',
                    description: cmd.setPermissions.description,
                    execute: (ctx, [commands, permissions]) => this.setPermissions(ctx, commands.asStrings, permissions.asOptionalBigint)
                },
                {
                    parameters: '{commands[]} disable',
                    description: cmd.disable.description,
                    execute: (ctx, [commands]) => this.setDisabled(ctx, commands.asStrings, true)
                },
                {
                    parameters: '{commands[]} enable',
                    description: cmd.enable.description,
                    execute: (ctx, [commands]) => this.setDisabled(ctx, commands.asStrings, false)
                },
                {
                    parameters: '{commands[]} hide',
                    description: cmd.hide.description,
                    execute: (ctx, [commands]) => this.setHidden(ctx, commands.asStrings, true)
                },
                {
                    parameters: '{commands[]} show',
                    description: cmd.show.description,
                    execute: (ctx, [commands]) => this.setHidden(ctx, commands.asStrings, false)
                }
            ]
        });
    }

    public async list(context: GuildCommandContext): Promise<CommandResult> {
        const lines = [];
        const commandNames = new Set<string>();
        const defaultPerms = new Map<unknown, string>();
        const commands: ICommand[] = [];
        for await (const result of context.cluster.commands.list(context.channel.guild)) {
            if (result.state === 'ALLOWED') {
                defaultPerms.set(result.detail.command.implementation, result.detail.command.permission);
                commands.push(result.detail.command);
            }
        }

        for (const command of commands) {
            const name = [command.name, ...command.aliases].find(n => commandNames.size < commandNames.add(n).size);
            if (name === undefined)
                continue;

            const roles = [];
            for (const roleStr of command.roles) {
                const role = await context.util.getRole(context.channel.guild, roleStr)
                    ?? context.channel.guild.roles.find(r => r.name.toLowerCase() === roleStr.toLowerCase());
                if (role !== undefined)
                    roles.push(role);
            }

            const fmt = {
                name: cmd.list.embed.description.name({ name }),
                roles: roles.length > 0
                    ? cmd.list.embed.description.roles({ roles })
                    : undefined,
                permissions: command.permission !== (defaultPerms.get(command.implementation) ?? '0')
                    ? cmd.list.embed.description.permissions({ permission: command.permission })
                    : undefined,
                disabled: command.disabled
                    ? cmd.list.embed.description.disabled
                    : undefined,
                hidden: command.hidden
                    ? cmd.list.embed.description.hidden
                    : undefined
            };
            if (fmt.roles === undefined && fmt.permissions === undefined && fmt.disabled === undefined && fmt.hidden === undefined)
                continue;

            lines.push(fmt);
        }

        if (lines.length === 0)
            return cmd.list.none;

        return {
            embeds: [
                {
                    author: context.util.embedifyAuthor(context.channel.guild),
                    title: cmd.list.embed.title,
                    description: cmd.list.embed.description.template({ commands: lines })
                }
            ]
        };
    }

    public async setRole(context: GuildCommandContext, commands: readonly string[], roles: readonly Role[] | undefined): Promise<CommandResult> {
        if (roles?.length === 0)
            roles = undefined;

        const updatedCommands = await this.#editCommands(context, commands, { roles: roles?.map(r => r.id) });

        return roles === undefined
            ? cmd.setRole.set({ commands: updatedCommands })
            : cmd.setRole.removed({ commands: updatedCommands });
    }

    public async setPermissions(context: GuildCommandContext, commands: readonly string[], permissions: bigint | undefined): Promise<CommandResult> {
        const updatedCommands = await this.#editCommands(context, commands, { permission: permissions?.toString() });

        return permissions === undefined
            ? cmd.setPermissions.set({ commands: updatedCommands })
            : cmd.setPermissions.removed({ commands: updatedCommands });
    }

    public async setDisabled(context: GuildCommandContext, commands: readonly string[], disabled: boolean): Promise<CommandResult> {
        const updatedCommands = await this.#editCommands(context, commands, { disabled: disabled ? true : undefined });

        return disabled
            ? cmd.disable.success({ commands: updatedCommands })
            : cmd.enable.success({ commands: updatedCommands });
    }

    public async setHidden(context: GuildCommandContext, commands: readonly string[], hidden: boolean): Promise<CommandResult> {
        const updatedCommands = await this.#editCommands(context, commands, { hidden: hidden ? true : undefined });

        return hidden
            ? cmd.hide.success({ commands: updatedCommands })
            : cmd.show.success({ commands: updatedCommands });
    }

    async #editCommands(context: GuildCommandContext, commands: readonly string[], update: Partial<CommandPermissions>): Promise<Iterable<string>> {
        return await context.cluster.commands.configure(context.author, commands, context.channel.guild, update);
    }
}
