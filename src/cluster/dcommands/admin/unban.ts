import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType } from '@blargbot/cluster/utils';
import { FlagResult } from '@blargbot/domain/models';
import { util } from '@blargbot/formatting';

import templates from '../../text';

const cmd = templates.commands.unban;

export class UnbanCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'unban',
            category: CommandType.ADMIN,
            flags: [
                { flag: 'r', word: 'reason', description: cmd.flags.reason }
            ],
            definitions: [
                {
                    parameters: '{userId}',
                    description: cmd.default.description,
                    execute: (ctx, [user], flags) => this.unban(ctx, user.asString, flags)
                }
            ]
        });
    }

    public async unban(context: GuildCommandContext, userId: string, flags: FlagResult): Promise<CommandResult> {
        const user = await context.util.getUser(userId);
        if (user === undefined)
            return cmd.default.userNotFound;

        const reason = flags.r?.merge().value;
        const state = await context.cluster.moderation.bans.unban(context.channel.guild, user, context.author, context.author, util.literal(reason));
        return cmd.default.state[state]({ user });
    }
}
