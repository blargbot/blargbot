import { BaseGuildCommand } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { codeBlock, CommandType } from '@cluster/utils';
import { CommandPermissions } from '@core/types';
import { guard } from '@core/utils';
import { MessageEmbedOptions, Role } from 'discord.js';

export class EditCommandCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'editcommand',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: 'list',
                    description: 'Shows a list of modified commands',
                    execute: (ctx) => this.list(ctx)
                },
                {
                    parameters: '{commands[]} setrole {roles:role[0]}',
                    description: 'Sets the role required to run the listed commands',
                    execute: (ctx, [commands, roles]) => this.setRole(ctx, commands, roles)
                },
                {
                    parameters: '{commands[]} setperm|setperms {permission:bigint?}',
                    description: 'Sets the permssions required to run the listed commands. If a user has any of the permissions, they will be able to use the command.',
                    execute: (ctx, [commands, permissions]) => this.setPermissions(ctx, commands, permissions)
                },
                {
                    parameters: '{commands[]} disable',
                    description: 'Disables the listed commands, so no one but the owner can use them',
                    execute: (ctx, [commands]) => this.setDisabled(ctx, commands, true)
                },
                {
                    parameters: '{commands[]} enable',
                    description: 'Enables the listed commands, allowing anyone with the correct permissions or roles to use them',
                    execute: (ctx, [commands]) => this.setDisabled(ctx, commands, false)
                },
                {
                    parameters: '{commands[]} hide',
                    description: 'Hides the listed commands. They can still be executed, but wont show up in help',
                    execute: (ctx, [commands]) => this.setHidden(ctx, commands, true)
                },
                {
                    parameters: '{commands[]} show',
                    description: 'Reveals the listed commands in help',
                    execute: (ctx, [commands]) => this.setHidden(ctx, commands, false)
                }
            ]
        });
    }

    public async list(context: GuildCommandContext): Promise<string | MessageEmbedOptions> {
        const lines = [];
        const commandNames = new Set<string>();
        const defaultPerms = new Map<unknown, string>();
        for await (const command of context.cluster.commands.list()) {
            defaultPerms.set(command.implementation, command.permission);
        }

        for await (const command of context.cluster.commands.list(context.channel, context.author)) {
            const name = [command.name, ...command.aliases].find(n => commandNames.size < commandNames.add(n).size);
            if (name === undefined)
                continue;

            lines.push(`**${name}**`);
            const len = lines.length;
            const roles = [];
            for (const roleStr of command.roles) {
                const role = await context.util.getRole(context.channel.guild, roleStr)
                    ?? context.channel.guild.roles.cache.find(r => r.name.toLowerCase() === roleStr.toLowerCase());
                if (role !== undefined)
                    roles.push(role);
            }

            if (roles.length > 0)
                lines.push(`- Roles: ${roles.map(r => r.toString()).join(', ')}`);

            if (command.permission !== (defaultPerms.get(command.implementation) ?? '0'))
                lines.push(`- Permissions: ${command.permission}`);

            const tagged = [
                command.disabled === true ? 'Disabled' : undefined,
                command.hidden === true ? 'Hidden' : undefined
            ].filter(guard.hasValue);
            if (tagged.length > 0)
                lines.push(`- ${tagged.join(', ')}`);

            if (len === lines.length)
                lines.pop();
        }

        if (lines.length === 0)
            return this.info('You havent modified any commands');

        return {
            author: context.util.embedifyAuthor(context.channel.guild),
            title: this.info('Edited commands'),
            description: lines.join('\n')
        };
    }

    public async setRole(context: GuildCommandContext, commands: string[], roles: Role[] | undefined): Promise<string> {
        if (roles?.length === 0)
            roles = undefined;

        const updatedCommands = await this.editCommands(context, commands, { roles: roles?.map(r => r.id) });

        if (roles === undefined)
            return this.success(`Removed the role requirement for the following commands:\n${codeBlock(updatedCommands, 'fix')}`);
        return this.success(`Set the role requirement for the following commands:\n${codeBlock(updatedCommands, 'fix')}`);
    }

    public async setPermissions(context: GuildCommandContext, commands: string[], permissions: bigint | undefined): Promise<string> {
        const updatedCommands = await this.editCommands(context, commands, { permission: permissions?.toString() });

        if (permissions === undefined)
            return this.success(`Removed the permissions for the following commands:\n${codeBlock(updatedCommands, 'fix')}`);
        return this.success(`Set the permissions for the following commands:\n${codeBlock(updatedCommands, 'fix')}`);
    }

    public async setDisabled(context: GuildCommandContext, commands: string[], disabled: boolean): Promise<string> {
        const updatedCommands = await this.editCommands(context, commands, { disabled: disabled ? true : undefined });

        if (!disabled)
            return this.success(`Enabled the following commands:\n${codeBlock(updatedCommands, 'fix')}`);
        return this.success(`Disabled the following commands:\n${codeBlock(updatedCommands, 'fix')}`);
    }

    public async setHidden(context: GuildCommandContext, commands: string[], hidden: boolean): Promise<string> {
        const updatedCommands = await this.editCommands(context, commands, { hidden: hidden ? true : undefined });

        if (!hidden)
            return this.success(`The following commands are no longer hidden:\n${codeBlock(updatedCommands, 'fix')}`);
        return this.success(`The following commands are now hidden:\n${codeBlock(updatedCommands, 'fix')}`);
    }

    private async editCommands(context: GuildCommandContext, commands: string[], update: Partial<CommandPermissions>): Promise<string> {
        const changed = await context.cluster.commands.configure(commands, context.channel.guild, update);
        return changed.join(', ');
    }
}
