import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, guard, parse } from '@blargbot/cluster/utils';
import { FlagResult } from '@blargbot/domain/models';

import templates from '../../text';

const cmd = templates.commands.massBan;

export class MassBanCommand extends GuildCommand {
    public constructor() {
        super({
            name: `massban`,
            aliases: [`hackban`],
            category: CommandType.ADMIN,
            flags: [
                { flag: `r`, word: `reason`, description: cmd.flags.reason }
            ],
            definitions: [
                {
                    parameters: `{userIds[]} {deleteDays:integer=1}`,
                    description: cmd.default.description,
                    execute: (ctx, [users, deleteDays], flags) => this.massBan(ctx, users.asStrings, deleteDays.asInteger, flags)
                }
            ]
        });
    }

    public async massBan(context: GuildCommandContext, userIds: readonly string[], deleteDays: number, flags: FlagResult): Promise<CommandResult> {
        userIds = userIds.flatMap(u => parse.entityId(u)).filter(guard.hasValue);

        const reason = flags.r?.merge().value ?? ``;

        const result = await context.cluster.moderation.bans.massBan(context.channel.guild, userIds, context.author, context.author, deleteDays, reason);
        if (Array.isArray(result))
            return cmd.default.success({ users: result });
        return cmd.default.state[result];
    }
}
