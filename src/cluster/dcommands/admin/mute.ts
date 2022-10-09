import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, parse } from '@blargbot/cluster/utils';
import { FlagResult } from '@blargbot/domain/models';
import { Member } from 'eris';

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
        const state = await context.cluster.moderation.mutes.unmute(member, context.author, reason);
        const result = cmd.clear.state[state];
        return typeof result === `function`
            ? result({ user: member.user })
            : result;
    }

    public async mute(context: GuildCommandContext, member: Member, flags: FlagResult): Promise<CommandResult> {
        const muteAvailable = await this.#checkMuteAvailable(context);
        if (muteAvailable !== true)
            return muteAvailable;

        const reason = flags.r?.merge().value;
        const rawDuration = flags.t !== undefined ? parse.duration(flags.t.merge().value) : undefined;
        const duration = rawDuration === undefined || rawDuration.asMilliseconds() <= 0 ? undefined : rawDuration;
        const state = await context.cluster.moderation.mutes.mute(member, context.author, reason, duration);
        if (state !== `success`) {
            const result = cmd.default.state[state];
            return typeof result === `function`
                ? result({ user: member.user })
                : result;
        }
        if (flags.t === undefined)
            return cmd.default.success.default({ user: member.user });
        if (duration === undefined)
            return cmd.default.success.durationInvalid({ user: member.user });
        return cmd.default.success.temporary({ user: member.user, unmute: duration });
    }

    async #checkMuteAvailable(context: GuildCommandContext): Promise<CommandResult | true> {
        switch (await context.cluster.moderation.mutes.ensureMutedRole(context.channel.guild)) {
            case `noPerms`: return cmd.default.createPermsMissing;
            case `unconfigured`: return cmd.default.configurePermsMissing;
            case `success`: return true;
        }
    }
}
