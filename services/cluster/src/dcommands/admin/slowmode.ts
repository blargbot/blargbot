import { CommandType } from '@blargbot/cluster/utils/index.js';
import { isGuildChannel, isTextableChannel } from '@blargbot/discord-util';
import * as Eris from 'eris';
import moment from 'moment-timezone';

import { GuildCommand } from '../../command/index.js';
import templates from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.slowMode;

export class SlowmodeCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'slowmode',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: '{time:integer} {channel:channel+?}',
                    description: cmd.on.description,
                    execute: (ctx, [time, channel]) => this.setSlowmode(time.asInteger, channel.asOptionalChannel ?? ctx.channel)
                },
                {
                    parameters: 'off {channel:channel+?}',
                    description: cmd.off.description,
                    execute: (ctx, [channel]) => this.disableSlowmode(channel.asOptionalChannel ?? ctx.channel)
                }
            ]
        });
    }

    public async setSlowmode(time: number, channel: Eris.KnownChannel): Promise<CommandResult> {
        if (!isGuildChannel(channel))
            return cmd.errors.notInGuild;
        if (!isTextableChannel(channel))
            return cmd.errors.notTextChannel;

        if (time > 120)
            return cmd.on.timeTooLong({ duration: moment.duration(120, 's') });

        if (time <= 0)
            return await this.disableSlowmode(channel);

        try {
            await channel.edit({ rateLimitPerUser: time });
            return cmd.on.success({ duration: moment.duration(time, 's'), channel });
        } catch (err: unknown) {
            if (err instanceof Eris.DiscordRESTError) {
                switch (err.code) {
                    case Eris.ApiError.MISSING_PERMISSIONS:
                        return cmd.errors.botNoPerms({ channel });
                }
            }
            throw err;
        }
    }

    public async disableSlowmode(channel: Eris.KnownChannel): Promise<CommandResult> {
        if (!isGuildChannel(channel))
            return cmd.errors.notInGuild;
        if (!isTextableChannel(channel))
            return cmd.errors.notTextChannel;

        try {
            await channel.edit({ rateLimitPerUser: 0 });
            return cmd.off.success({ channel });
        } catch (err: unknown) {
            if (err instanceof Eris.DiscordRESTError) {
                switch (err.code) {
                    case Eris.ApiError.MISSING_PERMISSIONS:
                        return cmd.errors.botNoPerms({ channel });
                }
            }
            throw err;
        }
    }
}
