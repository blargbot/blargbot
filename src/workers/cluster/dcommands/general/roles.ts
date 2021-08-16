import { BaseGuildCommand } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { CommandType } from '@cluster/utils';
import { MessageOptions } from 'discord.js';

export class RolesCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'roles',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: 'Displays a list of roles and their IDs.',
                    execute: ctx => this.showRoles(ctx)
                }
            ]
        });
    }

    public showRoles(context: GuildCommandContext): MessageOptions {
        return {
            embeds: [
                {
                    author: context.util.embedifyAuthor(context.channel.guild),
                    title: 'Roles',
                    description: context.channel.guild.roles.cache
                        .sort((a, b) => b.position - a.position)
                        .map(r => r.toString())
                        .join('\n')
                }
            ]
        };
    }
}
