import { BaseGuildCommand } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { CommandType, humanize } from '@cluster/utils';
import { GuildMember } from 'discord.js';

export class KickCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'kick',
            category: CommandType.ADMIN,
            flags: [
                { flag: 'r', word: 'reason', description: 'The reason for the kick.' }
            ],
            definitions: [
                {
                    parameters: '{user:member+}',
                    description: 'Kicks a user.\nIf mod-logging is enabled, the kick will be logged.',
                    execute: (ctx, [user], flags) => this.kick(ctx, user.asMember, flags.r?.merge().value)
                }
            ]
        });
    }

    public async kick(context: GuildCommandContext, member: GuildMember, reason: string | undefined): Promise<string> {
        switch (await context.cluster.moderation.bans.kick(member, context.author, true, reason)) {
            case 'memberTooHigh': return this.error(`I don't have permission to kick **${humanize.fullName(member.user)}**! Their highest role is above my highest role.`);
            case 'moderatorTooLow': return this.error(`You don't have permission to kick **${humanize.fullName(member.user)}**! Their highest role is above your highest role.`);
            case 'noPerms': return this.error(`I don't have permission to kick **${humanize.fullName(member.user)}**! Make sure I have the \`kick members\` permission and try again.`);
            case 'moderatorNoPerms': return this.error(`You don't have permission to kick **${humanize.fullName(member.user)}**! Make sure you have the \`kick members\` permission or one of the permissions specified in the \`kick override\` setting and try again.`);
            case 'success': return this.success(`**${humanize.fullName(member.user)}** has been kicked.`);
        }
    }
}
