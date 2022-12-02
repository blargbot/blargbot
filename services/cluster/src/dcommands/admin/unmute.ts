import { GuildCommand } from '../../command/index.js';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types.js';
import { CommandType } from '@blargbot/cluster/utils/index.js';
import { FlagResult } from '@blargbot/domain/models/index.js';
import { util } from '@blargbot/formatting';
import Eris from 'eris';

import templates from '../../text.js';

const cmd = templates.commands.unmute;

export class UnmuteCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'unmute',
            category: CommandType.ADMIN,
            flags: [
                { flag: 'r', word: 'reason', description: cmd.flags.reason }
            ],
            definitions: [
                {
                    parameters: '{user:member+}',
                    description: cmd.default.description,
                    execute: (ctx, [user], flags) => this.unmute(ctx, user.asMember, flags)
                }
            ]
        });
    }

    public async unmute(context: GuildCommandContext, member: Eris.Member, flags: FlagResult): Promise<CommandResult> {
        const state = await context.cluster.moderation.mutes.unmute(member, context.author, util.literal(flags.r?.merge().value));
        const reason = cmd.default.state[state];
        return typeof reason === 'function'
            ? reason({ user: member.user })
            : reason;
    }
}
