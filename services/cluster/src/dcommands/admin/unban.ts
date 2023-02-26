import type { CommandResult, GuildCommandContext } from '@blargbot/cluster/types.js';
import { CommandType } from '@blargbot/cluster/utils/index.js';
import { util } from '@blargbot/formatting';
import type { FlagResult } from '@blargbot/input';

import { GuildCommand } from '../../command/index.js';
import templates from '../../text.js';

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
