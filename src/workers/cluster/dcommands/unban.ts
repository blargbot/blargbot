import { BaseGuildCommand, commandTypes, FlagResult, GuildCommandContext } from '../core';
import { humanize } from '../core/globalCore';

export class UnbanCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'unban',
            category: commandTypes.ADMIN,
            flags: [
                { flag: 'r', word: 'reason', desc: 'The reason for the ban.' }
            ],
            definition: {
                parameters: '{userId}',
                description: 'Unbans a user.\n' +
                    'If mod-logging is enabled, the ban will be logged.',
                execute: (ctx, [user], flags) => this.unban(ctx, user, flags)
            }
        });
    }

    public async unban(context: GuildCommandContext, userId: string, flags: FlagResult): Promise<string> {
        const user = await context.util.getGlobalUser(userId);
        if (user === undefined)
            return '❌ I couldn\'t find that user!';

        const reason = flags.r?.join(' ');

        switch (await context.cluster.moderation.bans.unban(context.channel.guild, user, context.author, true, reason)) {
            case 'notBanned': return `❌ **${humanize.fullName(user)}** is not currently banned!`;
            case 'noPerms': return `❌ I don't have permission to unban **${humanize.fullName(user)}**! Make sure I have the \`ban members\` permission and try again.`;
            case 'moderatorNoPerms': return `❌ You don't have permission to unban **${humanize.fullName(user)}**! Make sure you have the \`ban members\` permission or one of the permissions specified in the \`ban override\` setting and try again.`;
            case 'success': return `✅ **${humanize.fullName(user)}** has been unbanned.`;
        }
    }
}
