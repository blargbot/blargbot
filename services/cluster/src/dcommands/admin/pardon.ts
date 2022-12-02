import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types.js';
import { CommandType, parse } from '@blargbot/cluster/utils/index.js';
import { FlagResult } from '@blargbot/domain/models/index.js';
import { util } from '@blargbot/formatting';
import * as Eris from 'eris';

import { GuildCommand } from '../../command/index.js';
import templates from '../../text.js';

const cmd = templates.commands.pardon;

export class PardonCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'pardon',
            category: CommandType.ADMIN,
            flags: [
                { flag: 'r', word: 'reason', description: cmd.flags.reason },
                { flag: 'c', word: 'count', description: cmd.flags.count }
            ],
            definitions: [
                {
                    parameters: '{user:member+}',
                    description: cmd.default.description,
                    execute: (ctx, [user], flags) => this.pardon(ctx, user.asMember, flags)
                }
            ]
        });
    }

    public async pardon(context: GuildCommandContext, member: Eris.Member, flags: FlagResult): Promise<CommandResult> {
        const reason = flags.r?.merge().value;
        const count = parse.int(flags.c?.merge().value ?? 1, { strict: true }) ?? NaN;

        const { state, warnings } = await context.cluster.moderation.warns.pardon(member, context.author, count, util.literal(reason));
        const result = cmd.default.state[state];
        return typeof result === 'function'
            ? result({ text: flags.c?.merge().value ?? '', user: member.user, count, warnings })
            : result;
    }
}
