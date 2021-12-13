import { BaseGuildCommand } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { CommandType } from '@cluster/utils';
import { EmbedOptions } from 'eris';

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

    public showRoles(context: GuildCommandContext): EmbedOptions {
        return {
            author: context.util.embedifyAuthor(context.channel.guild),
            title: 'Roles',
            description: [...context.channel.guild.roles.values()]
                .sort((a, b) => b.position - a.position)
                .map(r => r.mention)
                .join('\n')
        };
    }
}
