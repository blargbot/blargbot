import { GuildCommand } from '@blargbot/cluster/command';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType } from '@blargbot/cluster/utils';
import { User } from 'eris';

export class RemoveVotebanCommand extends GuildCommand {
    public constructor() {
        super({
            name: `removevoteban`,
            aliases: [`rvoteban`, `rvb`],
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: `{user:user+}`,
                    description: `Deletes all the vote bans against the given user`,
                    execute: (ctx, [user]) => this.clearUser(ctx, user.asUser)
                },
                {
                    parameters: ``,
                    description: `Deletes all vote bans against all users`,
                    execute: (ctx) => this.clearAll(ctx)
                }
            ]
        });
    }

    public async clearUser(context: GuildCommandContext, user: User): Promise<string> {
        await context.database.guilds.clearVoteBans(context.channel.guild.id, user.id);
        return `✅ Votebans for ${user.mention} have been cleared`;
    }

    public async clearAll(context: GuildCommandContext): Promise<string> {
        await context.database.guilds.clearVoteBans(context.channel.guild.id);
        return `✅ Votebans for all users have been cleared`;
    }
}
