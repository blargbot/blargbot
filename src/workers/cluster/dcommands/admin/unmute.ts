import { BaseGuildCommand } from '@cluster/command';
import { FlagResult, GuildCommandContext } from '@cluster/types';
import { CommandType, humanize } from '@cluster/utils';
import { GuildMember } from 'discord.js';

export class UnmuteCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'unmute',
            category: CommandType.ADMIN,
            flags: [
                { flag: 'r', word: 'reason', description: 'The reason for the unmute.' }
            ],
            definitions: [
                {
                    parameters: '{user:member+}',
                    description: 'Removes the special muted role from the user. \n' +
                        'If mod-logging is enabled, the mute will be logged.',
                    execute: (ctx, [user], flags) => this.unmute(ctx, user.asMember, flags)
                }
            ]
        });
    }

    public async unmute(context: GuildCommandContext, member: GuildMember, flags: FlagResult): Promise<string> {
        const reason = flags.r?.merge().value;

        switch (await context.cluster.moderation.mutes.unmute(member, context.author, reason)) {
            case 'notMuted': return this.error(`${humanize.fullName(member.user)} is not currently muted`);
            case 'noPerms': return this.error('I don\'t have permission to unmute users! Make sure I have the `manage roles` permission and try again.');
            case 'moderatorNoPerms': return this.error('You don\'t have permission to unmute users! Make sure you have the `manage roles` permission and try again.');
            case 'roleTooHigh': return this.error('I can\'t revoke the muted role! (it\'s higher than or equal to my top role)');
            case 'moderatorTooLow': return this.error('You can\'t revoke the muted role! (it\'s higher than or equal to your top role)');
            case 'success': return this.success(`**${humanize.fullName(member.user)}** has been muted`);
        }
    }
}
