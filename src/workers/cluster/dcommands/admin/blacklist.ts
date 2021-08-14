import { BaseGuildCommand } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { CommandType } from '@cluster/utils';
import { GuildChannels } from 'discord.js';

export class BlacklistCommandBase extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'blacklist',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: '{channel:channel?}',
                    description: 'Blacklists the current channel, or the channel that you mention. The bot will not respond until you do `blacklist` again.',
                    execute: (ctx, [channel]) => this.blacklist(ctx, channel ?? ctx.channel)
                }
            ]
        });
    }

    public async blacklist(context: GuildCommandContext, channel: GuildChannels): Promise<string> {
        const wasBlacklisted = await context.cluster.database.guilds.getChannelSetting(context.channel.guild.id, channel.id, 'blacklisted');
        await context.cluster.database.guilds.setChannelSetting(context.channel.guild.id, channel.id, 'blacklisted', wasBlacklisted !== true);

        return wasBlacklisted === true
            ? this.success(`${channel.toString()} is no longer blacklisted.`)
            : this.success(`${channel.toString()} is now blacklisted`);
    }
}
