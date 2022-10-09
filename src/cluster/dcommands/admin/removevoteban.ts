import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType } from '@blargbot/cluster/utils';
import { User } from 'eris';

import templates from '../../text';

const cmd = templates.commands.removeVoteBan;

export class RemoveVotebanCommand extends GuildCommand {
    public constructor() {
        super({
            name: `removevoteban`,
            aliases: [`rvoteban`, `rvb`],
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: `{user:user+}`,
                    description: cmd.user.description,
                    execute: (ctx, [user]) => this.clearUser(ctx, user.asUser)
                },
                {
                    parameters: ``,
                    description: cmd.all.description,
                    execute: (ctx) => this.clearAll(ctx)
                }
            ]
        });
    }

    public async clearUser(context: GuildCommandContext, user: User): Promise<CommandResult> {
        await context.database.guilds.clearVoteBans(context.channel.guild.id, user.id);
        return `✅ Votebans for ${user.mention} have been cleared`;
    }

    public async clearAll(context: GuildCommandContext): Promise<CommandResult> {
        await context.database.guilds.clearVoteBans(context.channel.guild.id);
        return `✅ Votebans for all users have been cleared`;
    }
}
