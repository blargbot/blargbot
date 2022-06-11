import { GuildCommand } from '@blargbot/cluster/command';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, humanize } from '@blargbot/cluster/utils';
import { Member } from 'eris';

export class UnTimeoutCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'untimeout',
            category: CommandType.ADMIN,
            flags: [
                { flag: 'r', word: 'reason', description: 'The reason for the timeout.' }
            ],
            definitions: [
                {
                    parameters: '{user:member+}',
                    description: 'Removes the timeout of a user.\nIf mod-logging is enabled, the timeout removal will be logged.',
                    execute: (ctx, [user], flags) => this.removeTimeout(ctx, user.asMember, flags.r?.merge().value ?? '')
                }
            ]
        });
    }

    public async removeTimeout(context: GuildCommandContext, member: Member, reason: string): Promise<string> {
        switch (await context.cluster.moderation.timeouts.removeTimeout(member, context.author, context.author, reason)) {
            case 'notTimedOut': return this.error(`**${humanize.fullName(member.user)}** is not currently timed out.`);
            case 'noPerms': return this.error(`I don't have permission to timeout **${humanize.fullName(member.user)}**! Make sure I have the \`moderate members\` permission and try again.`);
            case 'moderatorNoPerms': return this.error(`You don't have permission to timeout **${humanize.fullName(member.user)}**! Make sure you have the \`moderate members\` permission or one of the permissions specified in the \`timeout override\` setting and try again.`);
            case 'success': return this.success(`**${humanize.fullName(member.user)}** timeout has been removed.`);
        }
    }
}
