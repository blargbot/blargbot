import { BaseGuildCommand, commandTypes, GuildCommandContext, FlagResult } from '../core';
import { humanize } from '../core/globalCore';

export class KickCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'kick',
            category: commandTypes.ADMIN,
            flags: [
                { flag: 'r', word: 'reason', description: 'The reason for the kick.' }
            ],
            definitions: [
                {
                    parameters: '{user+}',
                    description: 'Kicks a user.\nIf mod-logging is enabled, the kick will be logged.',
                    execute: (ctx, [user], flags) => this.kick(ctx, user, flags)
                }
            ]
        });
    }

    public async kick(context: GuildCommandContext, user: string, flags: FlagResult): Promise<string> {
        const member = await context.util.getMember(context.message, user);
        if (member === undefined)
            return this.error('I couldn\'t find that user!');

        const reason = flags.r?.merge().value;

        switch (await context.cluster.moderation.bans.kick(member, context.author, true, reason)) {
            case 'memberTooHigh': return this.error(`I don't have permission to kick **${humanize.fullName(member)}**! Their highest role is above my highest role.`);
            case 'moderatorTooLow': return this.error(`You don't have permission to kick **${humanize.fullName(member)}**! Their highest role is above your highest role.`);
            case 'noPerms': return this.error(`I don't have permission to kick **${humanize.fullName(member)}**! Make sure I have the \`kick members\` permission and try again.`);
            case 'moderatorNoPerms': return this.error(`You don't have permission to kick **${humanize.fullName(member)}**! Make sure you have the \`kick members\` permission or one of the permissions specified in the \`kick override\` setting and try again.`);
            case 'success': return this.success(`**${humanize.fullName(member)}** has been kicked.`);
        }
    }
}
