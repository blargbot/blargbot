import { BaseGuildCommand, commandTypes, GuildCommandContext, humanize, FlagResult } from '../core';

export class UnmuteCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'unmute',
            category: commandTypes.ADMIN,
            flags: [
                { flag: 'r', word: 'reason', description: 'The reason for the unmute.' }
            ],
            definition: {
                parameters: '{user+}',
                description: 'Removes the special muted role from the user. \n' +
                    'If mod-logging is enabled, the mute will be logged.',
                execute: (ctx, [user], flags) => this.unmute(ctx, user.join(' '), flags)
            }
        });
    }

    public async unmute(context: GuildCommandContext, userStr: string, flags: FlagResult): Promise<string> {
        const member = await context.cluster.util.getMember(context.message, userStr);
        if (member === undefined)
            return this.error('I couldn\'t find that user!');

        const reason = flags.r?.merge().value;

        switch (await context.cluster.moderation.mutes.unmute(member, context.author, reason)) {
            case 'notMuted': return this.error(`${humanize.fullName(member)} is not currently muted`);
            case 'noPerms': return this.error('I don\'t have permission to unmute users! Make sure I have the `manage roles` permission and try again.');
            case 'moderatorNoPerms': return this.error('You don\'t have permission to unmute users! Make sure you have the `manage roles` permission and try again.');
            case 'roleTooHigh': return this.error('I can\'t revoke the muted role! (it\'s higher than or equal to my top role)');
            case 'moderatorTooLow': return this.error('You can\'t revoke the muted role! (it\'s higher than or equal to your top role)');
            case 'success': return this.success(`**${humanize.fullName(member)}** has been muted`);
        }
    }
}
