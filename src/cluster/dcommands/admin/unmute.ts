import { GuildCommand } from '@blargbot/cluster/command';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, humanize } from '@blargbot/cluster/utils';
import { FlagResult } from '@blargbot/domain/models';
import { Member } from 'eris';

export class UnmuteCommand extends GuildCommand {
    public constructor() {
        super({
            name: `unmute`,
            category: CommandType.ADMIN,
            flags: [
                { flag: `r`, word: `reason`, description: `The reason for the unmute.` }
            ],
            definitions: [
                {
                    parameters: `{user:member+}`,
                    description: `Removes the special muted role from the user. \nIf mod-logging is enabled, the mute will be logged.`,
                    execute: (ctx, [user], flags) => this.unmute(ctx, user.asMember, flags)
                }
            ]
        });
    }

    public async unmute(context: GuildCommandContext, member: Member, flags: FlagResult): Promise<string> {
        const reason = flags.r?.merge().value;

        switch (await context.cluster.moderation.mutes.unmute(member, context.author, reason)) {
            case `notMuted`: return `❌ ${humanize.fullName(member.user)} is not currently muted`;
            case `noPerms`: return `❌ I don't have permission to unmute users! Make sure I have the \`manage roles\` permission and try again.`;
            case `moderatorNoPerms`: return `❌ You don't have permission to unmute users! Make sure you have the \`manage roles\` permission and try again.`;
            case `roleTooHigh`: return `❌ I can't revoke the muted role! (it's higher than or equal to my top role)`;
            case `moderatorTooLow`: return `❌ You can't revoke the muted role! (it's higher than or equal to your top role)`;
            case `success`: return `✅ **${humanize.fullName(member.user)}** has been unmuted`;
        }
    }
}
