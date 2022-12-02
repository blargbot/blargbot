import { GuildCommand } from '../../command/index.js';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types.js';
import { CommandType } from '@blargbot/cluster/utils/index.js';
import { util } from '@blargbot/formatting';
import Eris from 'eris';

import templates from '../../text.js';

const cmd = templates.commands.kick;

export class KickCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'kick',
            category: CommandType.ADMIN,
            flags: [
                { flag: 'r', word: 'reason', description: cmd.flags.reason }
            ],
            definitions: [
                {
                    parameters: '{user:member+}',
                    description: cmd.default.description,
                    execute: (ctx, [user], flags) => this.kick(ctx, user.asMember, flags.r?.merge().value)
                }
            ]
        });
    }

    public async kick(context: GuildCommandContext, member: Eris.Member, reason: string | undefined): Promise<CommandResult> {
        const state = await context.cluster.moderation.bans.kick(member, context.author, context.author, util.literal(reason));
        return cmd.default.state[state]({ user: member.user });
    }
}
