import { GuildCommand } from '@blargbot/cluster/command';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, humanize, parse } from '@blargbot/cluster/utils';
import { FlagResult } from '@blargbot/domain/models';
import { User } from 'eris';
import moment from 'moment-timezone';

export class BanCommand extends GuildCommand {
    public constructor() {
        super({
            name: `ban`,
            category: CommandType.ADMIN,
            flags: [
                {
                    flag: `r`,
                    word: `reason`,
                    description: `The reason for the (un)ban.`
                },
                {
                    flag: `t`,
                    word: `time`,
                    description: `If provided, the user will be unbanned after the period of time. (softban)`
                }
            ],
            definitions: [
                {
                    parameters: `{user:user+} {days:integer=1}`,
                    description: `Bans a user, where \`days\` is the number of days to delete messages for.\nIf mod-logging is enabled, the ban will be logged.`,
                    execute: (ctx, [user, days], flags) => this.ban(ctx, user.asUser, days.asInteger, flags)
                },
                {
                    parameters: `clear {userId}`,
                    description: `Unbans a user.\nIf mod-logging is enabled, the ban will be logged.`,
                    execute: (ctx, [user], flags) => this.unban(ctx, user.asString, flags)
                }
            ]
        });
    }

    public async unban(context: GuildCommandContext, userId: string, flags: FlagResult): Promise<string> {
        const user = await context.util.getUser(userId);
        if (user === undefined)
            return `❌ I couldn't find that user!`;

        const reason = flags.r?.merge().value;

        switch (await context.cluster.moderation.bans.unban(context.channel.guild, user, context.author, context.author, reason)) {
            case `notBanned`: return `❌ **${humanize.fullName(user)}** is not currently banned!`;
            case `noPerms`: return `❌ I don't have permission to unban **${humanize.fullName(user)}**! Make sure I have the \`ban members\` permission and try again.`;
            case `moderatorNoPerms`: return `❌ You don't have permission to unban **${humanize.fullName(user)}**! Make sure you have the \`ban members\` permission or one of the permissions specified in the \`ban override\` setting and try again.`;
            case `success`: return `✅ **${humanize.fullName(user)}** has been unbanned.`;
        }
    }

    public async ban(context: GuildCommandContext, user: User, days: number, flags: FlagResult): Promise<string> {
        const reason = flags.r?.merge().value ?? ``;
        const duration = (flags.t !== undefined ? parse.duration(flags.t.merge().value) : undefined) ?? moment.duration(Infinity);

        switch (await context.cluster.moderation.bans.ban(context.channel.guild, user, context.author, context.author, days, reason, duration)) {
            case `alreadyBanned`: return `❌ **${humanize.fullName(user)}** is already banned!`;
            case `memberTooHigh`: return `❌ I don't have permission to ban **${humanize.fullName(user)}**! Their highest role is above my highest role.`;
            case `moderatorTooLow`: return `❌ You don't have permission to ban **${humanize.fullName(user)}**! Their highest role is above your highest role.`;
            case `noPerms`: return `❌ I don't have permission to ban **${humanize.fullName(user)}**! Make sure I have the \`ban members\` permission and try again.`;
            case `moderatorNoPerms`: return `❌ You don't have permission to ban **${humanize.fullName(user)}**! Make sure you have the \`ban members\` permission or one of the permissions specified in the \`ban override\` setting and try again.`;
            case `success`:
                if (flags.t === undefined)
                    return `✅ **${humanize.fullName(user)}** has been banned.`;
                if (duration.asMilliseconds() === Infinity)
                    return `⚠️ **${humanize.fullName(user)}** has been banned, but the duration was either 0 seconds or improperly formatted so they won't automatically be unbanned.`;
                return `✅ **${humanize.fullName(user)}** has been banned and will be unbanned in **<t:${moment().add(duration).unix()}:R>**`;
        }
    }
}
