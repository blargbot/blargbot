import { BaseGuildCommand } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { CommandType } from '@cluster/utils';
import { User } from 'discord.js';

export class RemoveVotebanCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'removevoteban',
            aliases: ['rvoteban', 'rvb'],
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: '{user:user+}',
                    description: 'Deletes all the vote bans against the given user',
                    execute: (ctx, [user]) => this.clearUser(ctx, user)
                },
                {
                    parameters: '',
                    description: 'Deletes all vote bans against all users',
                    execute: (ctx) => this.clearAll(ctx)
                }
            ]
        });
    }

    public async clearUser(context: GuildCommandContext, user: User): Promise<string> {
        await context.database.guilds.clearVoteBans(context.channel.guild.id, user.id);
        return this.success(`Votebans for ${user.toString()} have been cleared`);
    }

    public async clearAll(context: GuildCommandContext): Promise<string> {
        await context.database.guilds.clearVoteBans(context.channel.guild.id);
        return this.success('Votebans for all users have been cleared');
    }
}
