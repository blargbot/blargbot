import { BaseGuildCommand } from '@cluster/command';
import { CommandType } from '@cluster/utils';
import { Constants, DiscordAPIError, GuildTextBasedChannels } from 'discord.js';

export class SlowmodeCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'slowmode',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: '{time:integer} {channel:channel+?}',
                    description: 'Sets the channel\'s slowmode to 1 message every `time` seconds, with a max of 6 hours',
                    execute: (ctx, [time, channel]) => this.setSlowmode(time, channel ?? ctx.channel)
                },
                {
                    parameters: 'off {channel:channel+?}',
                    description: 'Turns off the channel\'s slowmode',
                    execute: (ctx, [channel]) => this.disableSlowmode(channel ?? ctx.channel)
                }
            ]
        });
    }

    public async setSlowmode(time: number, channel: GuildTextBasedChannels): Promise<string> {
        if (time > 120)
            return this.error('`time` must be less than 6 hours');

        if (time <= 0)
            return await this.disableSlowmode(channel);

        try {
            await channel.edit({ rateLimitPerUser: time });
            return this.success(`Slowmode has been set to 1 message every ${time} seconds in ${channel.toString()}`);
        } catch (err: unknown) {
            if (err instanceof DiscordAPIError) {
                switch (err.code) {
                    case Constants.APIErrors.MISSING_PERMISSIONS:
                        return this.error(`I dont have permission to set slowmode in ${channel.toString()}!`);
                }
            }
            throw err;
        }
    }

    public async disableSlowmode(channel: GuildTextBasedChannels): Promise<string> {
        try {
            await channel.edit({ rateLimitPerUser: 0 });
            return this.success(`Slowmode has been disabled in ${channel.toString()}`);
        } catch (err: unknown) {
            if (err instanceof DiscordAPIError) {
                switch (err.code) {
                    case Constants.APIErrors.MISSING_PERMISSIONS:
                        return this.error(`I dont have permission to set slowmode in ${channel.toString()}!`);
                }
            }
            throw err;
        }
    }
}
