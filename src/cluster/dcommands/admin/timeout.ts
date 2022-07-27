import { GuildCommand } from '@blargbot/cluster/command';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, humanize, parse } from '@blargbot/cluster/utils';
import { FlagResult } from '@blargbot/domain/models';
import { Member } from 'eris';
import moment from 'moment-timezone';

export class TimeoutCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'timeout',
            category: CommandType.ADMIN,
            flags: [
                { flag: 'r', word: 'reason', description: 'The reason for the timeout (removal).' },
                {
                    flag: 't',
                    word: 'time',
                    description: 'The amount of time to mute for, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d2h3m4s\', or some other combination.\n' +
                        'Maximum allowed time is 28 days. Default is 1 day.'
                }
            ],
            definitions: [
                {
                    parameters: '{user:member+}',
                    description: 'Timeouts a user.\nIf mod-logging is enabled, the timeout will be logged.',
                    execute: (ctx, [user], flags) => this.timeout(ctx, user.asMember, flags)
                },
                {
                    parameters: 'clear {user:member+}',
                    description: 'Removes the timeout of a user.\nIf mod-logging is enabled, the timeout removal will be logged.',
                    execute: (ctx, [user], flags) => this.clearTimeout(ctx, user.asMember, flags.r?.merge().value ?? '')
                }
            ]
        });
    }

    public async clearTimeout(context: GuildCommandContext, member: Member, reason: string): Promise<string> {
        switch (await context.cluster.moderation.timeouts.clearTimeout(member, context.author, context.author, reason)) {
            case 'notTimedOut': return this.error(`**${humanize.fullName(member.user)}** is not currently timed out.`);
            case 'noPerms': return this.error(`I don't have permission to timeout **${humanize.fullName(member.user)}**! Make sure I have the \`moderate members\` permission and try again.`);
            case 'moderatorNoPerms': return this.error(`You don't have permission to timeout **${humanize.fullName(member.user)}**! Make sure you have the \`moderate members\` permission or one of the permissions specified in the \`timeout override\` setting and try again.`);
            case 'success': return this.success(`**${humanize.fullName(member.user)}** timeout has been removed.`);
        }
    }

    public async timeout(context: GuildCommandContext, member: Member, flags: FlagResult): Promise<string> {
        const reason = flags.r?.merge().value ?? '';
        const duration = (flags.t !== undefined ? parse.duration(flags.t.merge().value) : undefined) ?? moment.duration(1, 'd');

        switch (await context.cluster.moderation.timeouts.timeout(member, context.author, context.author, duration, reason)) {
            case 'memberTooHigh': return this.error(`I don't have permission to timeout **${humanize.fullName(member.user)}**! Their highest role is above my highest role.`);
            case 'moderatorTooLow': return this.error(`You don't have permission to timeout **${humanize.fullName(member.user)}**! Their highest role is above your highest role.`);
            case 'noPerms': return this.error(`I don't have permission to timeout **${humanize.fullName(member.user)}**! Make sure I have the \`moderate members\` permission and try again.`);
            case 'moderatorNoPerms': return this.error(`You don't have permission to timeout **${humanize.fullName(member.user)}**! Make sure you have the \`moderate members\` permission or one of the permissions specified in the \`timeout override\` setting and try again.`);
            case 'alreadyTimedOut': return this.error(`**${humanize.fullName(member.user)}** has already been timed out.`);
            case 'success': return this.success(`**${humanize.fullName(member.user)}** has been timed out.`);
        }
    }
}
