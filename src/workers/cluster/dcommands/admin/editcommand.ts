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
        const dcommandPerms = await context.database.guilds.getCommandPerms(context.channel.guild.id) ?? {};
        const ccommands = await context.database.guilds.listCommands(context.channel.guild.id);

        const result = {} as Record<string, CommandPermissions>;
        for (const command of ccommands)
            result[command.name] = command;
        for (const [command, perms] of Object.entries(dcommandPerms))
            result[command] ??= perms;

        const lines = [];
        for (const [command, perms] of Object.entries(result)) {
            lines.push(`**${command}**`);
            const len = lines.length;
            if (perms.roles !== undefined) {
                const roles = await Promise.all(perms.roles.map(r => context.util.findRoles(context.channel.guild, r)));
                lines.push(`- Roles: ${roles.flat().map(r => r.toString()).join(', ')}`);
            }

            if (perms.permission !== undefined)
                lines.push(`- Permissions: ${perms.permission}`);

            const tagged = [
                perms.disabled === true ? 'Disabled' : undefined,
                perms.hidden === true ? 'Hidden' : undefined
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
        const updatedCommands = await this.editCommands(context, commands, { permission: permissions });

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
        const dcommands: string[] = [];
        const ccommands: string[] = [];

        const ccommandNames = new Set((await context.database.guilds.listCommands(context.channel.guild.id)).map(c => c.name.toLowerCase()));
        for (const command of commands.map(c => c.toLowerCase())) {
            if (ccommandNames.has(command))
                ccommands.push(command);
            else if (context.cluster.commands.get(command) !== undefined)
                dcommands.push(command);
        }

        if (dcommands.length > 0)
            await context.database.guilds.setCommandPerms(context.channel.guild.id, dcommands, update);

        if (ccommands.length > 0)
            await context.database.guilds.updateCommands(context.channel.guild.id, ccommands, update);

        return [...dcommands, ...ccommands].join(', ');
    }
}
