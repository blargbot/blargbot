import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType } from '@blargbot/cluster/utils';
import { util } from '@blargbot/formatting';
import { Member } from 'eris';

import templates from '../../text';

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

    public async kick(context: GuildCommandContext, member: Member, reason: string | undefined): Promise<CommandResult> {
        const state = await context.cluster.moderation.bans.kick(member, context.author, context.author, util.literal(reason));
        return cmd.default.state[state]({ user: member.user });
    }
}
