import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, humanize, parse } from '@blargbot/cluster/utils';
import { FlagResult } from '@blargbot/domain/models';
import { Member } from 'eris';
import moment from 'moment-timezone';

import templates from '../../text';

const cmd = templates.commands.mute;

export class MuteCommand extends GuildCommand {
    public constructor() {
        super({
            name: `mute`,
            category: CommandType.ADMIN,
            flags: [
                { flag: `r`, word: `reason`, description: cmd.flags.reason },
                { flag: `t`, word: `time`, description: cmd.flags.time }
            ],
            definitions: [
                {
                    parameters: `{user:member+}`,
                    description: cmd.default.description,
                    execute: (ctx, [user], flags) => this.mute(ctx, user.asMember, flags)
                },

                {
                    parameters: `clear {user:member+}`,
                    description: cmd.clear.description,
                    execute: (ctx, [user], flags) => this.unmute(ctx, user.asMember, flags)
                }
            ]
        });
    }

    public async unmute(context: GuildCommandContext, member: Member, flags: FlagResult): Promise<CommandResult> {
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

    public async mute(context: GuildCommandContext, member: Member, flags: FlagResult): Promise<CommandResult> {
        const muteAvailable = await this.#checkMuteAvailable(context);
        if (muteAvailable !== true)
            return muteAvailable;

        const reason = flags.r?.merge().value;
        const rawDuration = flags.t !== undefined ? parse.duration(flags.t.merge().value) : undefined;
        const duration = rawDuration === undefined || rawDuration.asMilliseconds() <= 0 ? undefined : rawDuration;

        switch (await context.cluster.moderation.mutes.mute(member, context.author, reason, duration)) {
            case `alreadyMuted`: return `❌ ${humanize.fullName(member.user)} is already muted`;
            case `noPerms`: return `❌ I don't have permission to mute users! Make sure I have the \`manage roles\` permission and try again.`;
            case `moderatorNoPerms`: return `❌ You don't have permission to mute users! Make sure you have the \`manage roles\` permission and try again.`;
            case `roleMissing`: return `❌ The muted role has been deleted! Please re-run this command to create a new one.`;
            case `roleTooHigh`: return `❌ I can't assign the muted role! (it's higher than or equal to my top role)`;
            case `moderatorTooLow`: return `❌ You can't assign the muted role! (it's higher than or equal to your top role)`;
            case `success`:
                if (flags.t === undefined)
                    return `✅ **${humanize.fullName(member.user)}** has been muted`;
                if (duration === undefined)
                    return `⚠️ **${humanize.fullName(member.user)}** has been muted, but the duration was either 0 seconds or improperly formatted so they won't automatically be unmuted.`;
                return `✅ **${humanize.fullName(member.user)}** has been muted and will be unmuted **<t:${moment().add(duration).unix()}:R>**`;
        }
    }

    async #checkMuteAvailable(context: GuildCommandContext): Promise<CommandResult | true> {
        switch (await context.cluster.moderation.mutes.ensureMutedRole(context.channel.guild)) {
            case `noPerms`: return `❌ I don't have enough permissions to create a \`muted\` role! Make sure I have the \`manage roles\` permission and try again.`;
            case `unconfigured`: return `❌ I created a \`muted\` role, but don't have permissions to configure it! Either configure it yourself, or make sure I have the \`manage channel\` permission, delete the \`muted\` role, and try again.`;
            case `success`: return true;
        }
    }
}
