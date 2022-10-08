import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, humanize } from '@blargbot/cluster/utils';
import { Member } from 'eris';

export class KickCommand extends GuildCommand {
    public constructor() {
        super({
            name: `kick`,
            category: CommandType.ADMIN,
            flags: [
                { flag: `r`, word: `reason`, description: `The reason for the kick.` }
            ],
            definitions: [
                {
                    parameters: `{user:member+}`,
                    description: `Kicks a user.\nIf mod-logging is enabled, the kick will be logged.`,
                    execute: (ctx, [user], flags) => this.kick(ctx, user.asMember, flags.r?.merge().value)
                }
            ]
        });
    }

    public async kick(context: GuildCommandContext, member: Member, reason: string | undefined): Promise<CommandResult> {
        switch (await context.cluster.moderation.bans.kick(member, context.author, context.author, reason)) {
            case `memberTooHigh`: return `❌ I don't have permission to kick **${humanize.fullName(member.user)}**! Their highest role is above my highest role.`;
            case `moderatorTooLow`: return `❌ You don't have permission to kick **${humanize.fullName(member.user)}**! Their highest role is above your highest role.`;
            case `noPerms`: return `❌ I don't have permission to kick **${humanize.fullName(member.user)}**! Make sure I have the \`kick members\` permission and try again.`;
            case `moderatorNoPerms`: return `❌ You don't have permission to kick **${humanize.fullName(member.user)}**! Make sure you have the \`kick members\` permission or one of the permissions specified in the \`kick override\` setting and try again.`;
            case `success`: return `✅ **${humanize.fullName(member.user)}** has been kicked.`;
        }
    }
}
