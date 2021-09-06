import { BaseGuildCommand } from '@cluster/command';
import { FlagResult, GuildCommandContext } from '@cluster/types';
import { CommandType, humanize, parse } from '@cluster/utils';
import { GuildMember } from 'discord.js';
import moment from 'moment';

export class BanCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'ban',
            category: CommandType.ADMIN,
            flags: [
                { flag: 'r', word: 'reason', description: 'The reason for the ban.' },
                {
                    flag: 't',
                    word: 'time',
                    description: 'If provided, the user will be unbanned after the period of time. (softban)'
                }
            ],
            definitions: [
                {
                    parameters: '{user:member+} {days:number=1}',
                    description: 'Bans a user, where `days` is the number of days to delete messages for.\n' +
                        'If mod-logging is enabled, the ban will be logged.',
                    execute: (ctx, [user, days], flags) => this.ban(ctx, user, days, flags)
                }
            ]
        });
    }

    public async ban(context: GuildCommandContext, member: GuildMember, days: number, flags: FlagResult): Promise<string> {
        const reason = flags.r?.merge().value;
        const rawDuration = flags.t !== undefined ? parse.duration(flags.t.merge().value) : undefined;
        const duration = rawDuration === undefined || rawDuration.asMilliseconds() <= 0 ? undefined : rawDuration;

        switch (await context.cluster.moderation.bans.ban(context.channel.guild, member.user, context.author, true, days, reason, duration)) {
            case 'alreadyBanned': return this.error(`**${humanize.fullName(member.user)}** is already banned!`);
            case 'memberTooHigh': return this.error(`I don't have permission to ban **${humanize.fullName(member.user)}**! Their highest role is above my highest role.`);
            case 'moderatorTooLow': return this.error(`You don't have permission to ban **${humanize.fullName(member.user)}**! Their highest role is above your highest role.`);
            case 'noPerms': return this.error(`I don't have permission to ban **${humanize.fullName(member.user)}**! Make sure I have the \`ban members\` permission and try again.`);
            case 'moderatorNoPerms': return this.error(`You don't have permission to ban **${humanize.fullName(member.user)}**! Make sure you have the \`ban members\` permission or one of the permissions specified in the \`ban override\` setting and try again.`);
            case 'success':
                if (flags.t === undefined)
                    return this.success(`**${humanize.fullName(member.user)}** has been banned.`);
                if (duration === undefined)
                    return this.warning(`**${humanize.fullName(member.user)}** has been banned, but the duration was either 0 seconds or improperly formatted so they won't automatically be unbanned.`);
                return this.success(`**${humanize.fullName(member.user)}** has been banned and will be unbanned in **<t:${moment().add(duration).unix()}:R>**`);
        }
    }
}
