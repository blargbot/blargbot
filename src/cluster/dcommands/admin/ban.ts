import { GuildCommand } from '@blargbot/cluster/command';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, humanize, parse } from '@blargbot/cluster/utils';
import { FlagResult } from '@blargbot/domain/models';
import { Member } from 'eris';
import moment from 'moment-timezone';

export class BanCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'ban',
            category: CommandType.ADMIN,
            flags: [
                { flag: 'r', word: 'reason', description: 'The reason for the (un)ban.' },
                {
                    flag: 't',
                    word: 'time',
                    description: 'If provided, the user will be unbanned after the period of time. (softban)'
                }
            ],
            definitions: [
                {
                    parameters: '{user:member+} {days:integer=1}',
                    description: 'Bans a user, where `days` is the number of days to delete messages for.\n' +
                        'If mod-logging is enabled, the ban will be logged.',
                    execute: (ctx, [user, days], flags) => this.ban(ctx, user.asMember, days.asInteger, flags)
                },
                {
                    parameters: 'clear {userId}',
                    description: 'Unbans a user.\n' +
                        'If mod-logging is enabled, the ban will be logged.',
                    execute: (ctx, [user], flags) => this.unban(ctx, user.asString, flags)
                }
            ]
        });
    }

    public async unban(context: GuildCommandContext, userId: string, flags: FlagResult): Promise<string> {
        const user = await context.util.getUser(userId);
        if (user === undefined)
            return this.error('I couldn\'t find that user!');

        const reason = flags.r?.merge().value;

        switch (await context.cluster.moderation.bans.unban(context.channel.guild, user, context.author, context.author, reason)) {
            case 'notBanned': return this.error(`**${humanize.fullName(user)}** is not currently banned!`);
            case 'noPerms': return this.error(`I don't have permission to unban **${humanize.fullName(user)}**! Make sure I have the \`ban members\` permission and try again.`);
            case 'moderatorNoPerms': return this.error(`You don't have permission to unban **${humanize.fullName(user)}**! Make sure you have the \`ban members\` permission or one of the permissions specified in the \`ban override\` setting and try again.`);
            case 'success': return this.success(`**${humanize.fullName(user)}** has been unbanned.`);
        }
    }

    public async ban(context: GuildCommandContext, member: Member, days: number, flags: FlagResult): Promise<string> {
        const reason = flags.r?.merge().value ?? '';
        const duration = (flags.t !== undefined ? parse.duration(flags.t.merge().value) : undefined) ?? moment.duration(Infinity);

        switch (await context.cluster.moderation.bans.ban(context.channel.guild, member.user, context.author, context.author, days, reason, duration)) {
            case 'alreadyBanned': return this.error(`**${humanize.fullName(member.user)}** is already banned!`);
            case 'memberTooHigh': return this.error(`I don't have permission to ban **${humanize.fullName(member.user)}**! Their highest role is above my highest role.`);
            case 'moderatorTooLow': return this.error(`You don't have permission to ban **${humanize.fullName(member.user)}**! Their highest role is above your highest role.`);
            case 'noPerms': return this.error(`I don't have permission to ban **${humanize.fullName(member.user)}**! Make sure I have the \`ban members\` permission and try again.`);
            case 'moderatorNoPerms': return this.error(`You don't have permission to ban **${humanize.fullName(member.user)}**! Make sure you have the \`ban members\` permission or one of the permissions specified in the \`ban override\` setting and try again.`);
            case 'success':
                if (flags.t === undefined)
                    return this.success(`**${humanize.fullName(member.user)}** has been banned.`);
                if (duration.asMilliseconds() === Infinity)
                    return this.warning(`**${humanize.fullName(member.user)}** has been banned, but the duration was either 0 seconds or improperly formatted so they won't automatically be unbanned.`);
                return this.success(`**${humanize.fullName(member.user)}** has been banned and will be unbanned in **<t:${moment().add(duration).unix()}:R>**`);
        }
    }
}
