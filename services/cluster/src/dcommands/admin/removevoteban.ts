import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types.js';
import { CommandType } from '@blargbot/cluster/utils/index.js';
import * as Eris from 'eris';

import { GuildCommand } from '../../command/index.js';
import templates from '../../text.js';

const cmd = templates.commands.removeVoteBan;

export class RemoveVotebanCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'removevoteban',
            aliases: ['rvoteban', 'rvb'],
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: '{user:user+}',
                    description: cmd.user.description,
                    execute: (ctx, [user]) => this.clearUser(ctx, user.asUser)
                },
                {
                    parameters: '',
                    description: cmd.all.description,
                    execute: (ctx) => this.clearAll(ctx)
                }
            ]
        });
    }

    public async clearUser(context: GuildCommandContext, user: Eris.User): Promise<CommandResult> {
        await context.database.guilds.clearVoteBans(context.channel.guild.id, user.id);
        return cmd.user.success({ user });
    }

    public async clearAll(context: GuildCommandContext): Promise<CommandResult> {
        await context.database.guilds.clearVoteBans(context.channel.guild.id);
        return cmd.all.success;
    }
}
