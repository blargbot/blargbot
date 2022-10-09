import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, humanize } from '@blargbot/cluster/utils';
import { Member } from 'eris';

import templates from '../../text';

const cmd = templates.commands.kick;

export class KickCommand extends GuildCommand {
    public constructor() {
        super({
            name: `kick`,
            category: CommandType.ADMIN,
            flags: [
                { flag: `r`, word: `reason`, description: cmd.flags.reason }
            ],
            definitions: [
                {
                    parameters: `{user:member+}`,
                    description: cmd.default.description,
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
