import type { CommandResult, GuildCommandContext } from '@blargbot/cluster/types.js';
import { CommandType } from '@blargbot/cluster/utils/index.js';
import { markup } from '@blargbot/discord-util';
import { util } from '@blargbot/formatting';
import type { FlagResult } from '@blargbot/input';
import snowflake from '@blargbot/snowflakes';

import { GuildCommand } from '../../command/index.js';
import templates from '../../text.js';

const cmd = templates.commands.massBan;

export class MassBanCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'massban',
            aliases: ['hackban'],
            category: CommandType.ADMIN,
            flags: [
                { flag: 'r', word: 'reason', description: cmd.flags.reason }
            ],
            definitions: [
                {
                    parameters: '{userIds[]} {deleteDays:integer=1}',
                    description: cmd.default.description,
                    execute: (ctx, [users, deleteDays], flags) => this.massBan(ctx, users.asStrings, deleteDays.asInteger, flags)
                }
            ]
        });
    }

    public async massBan(context: GuildCommandContext, userIds: readonly string[], deleteDays: number, flags: FlagResult): Promise<CommandResult> {
        userIds = userIds.flatMap(u => [...markup.user.findAll(u), u]).filter(snowflake.test);

        const reason = flags.r?.merge().value ?? '';

        const result = await context.cluster.moderation.bans.massBan(context.channel.guild, userIds, context.author, context.author, deleteDays, util.literal(reason));
        if (Array.isArray(result))
            return cmd.default.success({ users: result });
        return cmd.default.state[result];
    }
}
