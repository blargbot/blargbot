import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types.js';
import { CommandType, parse } from '@blargbot/cluster/utils/index.js';
import { FlagResult } from '@blargbot/domain/models/index.js';
import { util } from '@blargbot/formatting';
import * as Eris from 'eris';
import moment from 'moment-timezone';

import { GuildCommand } from '../../command/index.js';
import templates from '../../text.js';

const cmd = templates.commands.ban;

export class BanCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'ban',
            category: CommandType.ADMIN,
            flags: [
                { flag: 'r', word: 'reason', description: cmd.flags.reason },
                { flag: 't', word: 'time', description: cmd.flags.time }
            ],
            definitions: [
                {
                    parameters: '{user:user+} {days:integer=1}',
                    description: cmd.default.description,
                    execute: (ctx, [user, days], flags) => this.ban(ctx, user.asUser, days.asInteger, flags)
                },
                {
                    parameters: 'clear {userId}',
                    description: cmd.clear.description,
                    execute: (ctx, [user], flags) => this.unban(ctx, user.asString, flags)
                }
            ]
        });
    }

    public async unban(context: GuildCommandContext, userId: string, flags: FlagResult): Promise<CommandResult> {
        const user = await context.util.getUser(userId);
        if (user === undefined)
            return cmd.clear.userNotFound;

        const reason = flags.r?.merge().value;
        const result = await context.cluster.moderation.bans.unban(context.channel.guild, user, context.author, context.author, util.literal(reason));
        return cmd.clear.state[result]({ user });
    }

    public async ban(context: GuildCommandContext, user: Eris.User, days: number, flags: FlagResult): Promise<CommandResult> {
        const reason = flags.r?.merge().value ?? '';
        const duration = (flags.t !== undefined ? parse.duration(flags.t.merge().value) : undefined) ?? moment.duration(Infinity);

        const state = await context.cluster.moderation.bans.ban(context.channel.guild, user, context.author, context.author, days, util.literal(reason), duration);
        if (state !== 'success' || flags.t === undefined)
            return cmd.default.state[state]({ user });

        return duration.asMilliseconds() === Infinity
            ? cmd.default.unbanSchedule.invalid({ user })
            : cmd.default.unbanSchedule.success({ user, unban: duration });

    }
}
