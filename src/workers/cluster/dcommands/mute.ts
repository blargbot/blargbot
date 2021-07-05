import { BaseGuildCommand, commandTypes, FlagResult, GuildCommandContext, parse } from '../core';
import { humanize } from '../core/globalCore';

export class MuteCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'mute',
            category: commandTypes.ADMIN,
            flags: [
                { flag: 'r', word: 'reason', desc: 'The reason for the mute.' },
                {
                    flag: 't',
                    word: 'time',
                    desc: 'The amount of time to mute for, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d2h3m4s\', or some other combination.'
                }
            ],
            definition: {
                parameters: '{user}',
                description: 'Gives the user a special muted role. On first run, this role will be created. ' +
                    'The bot needs to be able to `manage roles` to create and assign the role, and `manage channels` to configure the role. ' +
                    'You are able to manually configure the role without the bot, but the bot has to make it. ' +
                    'Deleting the muted role causes it to be regenerated.\n' +
                    'If the bot has permissions for it, this command will also voice-mute the user.\n' +
                    'If mod-logging is enabled, the mute will be logged.\n' +
                    'You can also specify a length of time the user should be muted for, using formats such as `1 hour 2 minutes` or `1h2m`.',
                execute: (ctx, [user], flags) => this.mute(ctx, user, flags)
            }
        });
    }

    public async mute(context: GuildCommandContext, userStr: string, flags: FlagResult): Promise<string> {
        const muteAvailable = await this.checkMuteAvailable(context);
        if (muteAvailable !== true)
            return muteAvailable;

        const member = await context.cluster.util.getMember(context.message, userStr);
        if (member === undefined)
            return '❌ I couldn\'t find that user!';

        const reason = flags.r?.join(' ');
        const rawDuration = flags.t !== undefined ? parse.duration(flags.t.join(' ')) : undefined;
        const duration = rawDuration === undefined || rawDuration.asMilliseconds() <= 0 ? undefined : rawDuration;

        switch (await context.cluster.moderation.mutes.mute(member, context.author, reason, duration)) {
            case 'alreadyMuted': return `❌ ${humanize.fullName(member)} is already muted`;
            case 'noPerms': return '❌ I don\'t have permission to mute users! Make sure I have the `manage roles` permission and try again.';
            case 'roleMissing': return '❌ The muted role has been deleted! Please re-run this command to create a new one.';
            case 'roleTooHigh': return '❌ I can\'t assign the muted role! (it\'s higher than or equal to my top role)';
            case 'success':
                if (flags.t === undefined)
                    return `✅ ${humanize.fullName(member)} has been muted`;
                if (duration === undefined)
                    return `⚠️ ${humanize.fullName(member)} has been muted, but the duration was either 0 seconds or improperly formatted so they won't automatically be unmuted.`;
                return `✅ ${humanize.fullName(member)} has been muted and will be unmuted after ${humanize.duration(duration)}`;
        }
    }

    private async checkMuteAvailable(context: GuildCommandContext): Promise<string | true> {
        switch (await context.cluster.moderation.mutes.ensureMutedRole(context.channel.guild)) {
            case 'noPerms': return '❌ I don\'t have enough permissions to create a `muted` role! Make sure I have the `manage roles` permission and try again.';
            case 'unconfigured': return '❌ I created a `muted` role, but don\'t have permissions to configure it! Either configure it yourself, or make sure I have the `manage channel` permission, delete the `muted` role, and try again.';
            case 'success': return true;
        }
    }
}
