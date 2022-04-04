import { GuildCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';
import { guard } from '@blargbot/core/utils';
import { ApiError, DiscordRESTError, KnownChannel } from 'eris';

export class SlowmodeCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'slowmode',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: '{time:integer} {channel:channel+?}',
                    description: 'Sets the channel\'s slowmode to 1 message every `time` seconds, with a max of 6 hours',
                    execute: (ctx, [time, channel]) => this.setSlowmode(time.asInteger, channel.asOptionalChannel ?? ctx.channel)
                },
                {
                    parameters: 'off {channel:channel+?}',
                    description: 'Turns off the channel\'s slowmode',
                    execute: (ctx, [channel]) => this.disableSlowmode(channel.asOptionalChannel ?? ctx.channel)
                }
            ]
        });
    }

    public async setSlowmode(time: number, channel: KnownChannel): Promise<string> {
        if (!guard.isTextableChannel(channel))
            return this.error('You can only set slowmode on text channels!');
        if (!guard.isGuildChannel(channel))
            return this.error('You cant set slowmode on channels outside of a server');

        if (time > 120)
            return this.error('`time` must be less than 6 hours');

        if (time <= 0)
            return await this.disableSlowmode(channel);

        try {
            await channel.edit({ rateLimitPerUser: time });
            return this.success(`Slowmode has been set to 1 message every ${time} seconds in ${channel.mention}`);
        } catch (err: unknown) {
            if (err instanceof DiscordRESTError) {
                switch (err.code) {
                    case ApiError.MISSING_PERMISSIONS:
                        return this.error(`I dont have permission to set slowmode in ${channel.mention}!`);
                }
            }
            throw err;
        }
    }

    public async disableSlowmode(channel: KnownChannel): Promise<string> {
        if (!guard.isTextableChannel(channel))
            return this.error('You can only set slowmode on text channels!');
        if (!guard.isGuildChannel(channel))
            return this.error('You cant set slowmode on channels outside of a server');

        try {
            await channel.edit({ rateLimitPerUser: 0 });
            return this.success(`Slowmode has been disabled in ${channel.mention}`);
        } catch (err: unknown) {
            if (err instanceof DiscordRESTError) {
                switch (err.code) {
                    case ApiError.MISSING_PERMISSIONS:
                        return this.error(`I dont have permission to set slowmode in ${channel.mention}!`);
                }
            }
            throw err;
        }
    }
}
