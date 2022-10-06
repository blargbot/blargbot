import { GuildCommand } from '@blargbot/cluster/command';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType } from '@blargbot/cluster/utils';
import { guard } from '@blargbot/core/utils';
import { KnownChannel } from 'eris';

export class BlacklistCommandBase extends GuildCommand {
    public constructor() {
        super({
            name: `blacklist`,
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: `{channel:channel+?}`,
                    description: `Blacklists the current channel, or the channel that you mention. The bot will not respond until you do \`blacklist\` again.`,
                    execute: (ctx, [channel]) => this.blacklist(ctx, channel.asOptionalChannel ?? ctx.channel)
                }
            ]
        });
    }

    public async blacklist(context: GuildCommandContext, channel: KnownChannel): Promise<string> {
        if (!guard.isGuildChannel(channel) || channel.guild !== context.channel.guild)
            return this.error(`You cannot blacklist a channel outside of this server`);

        const wasBlacklisted = await context.cluster.database.guilds.getChannelSetting(context.channel.guild.id, channel.id, `blacklisted`);
        await context.cluster.database.guilds.setChannelSetting(context.channel.guild.id, channel.id, `blacklisted`, wasBlacklisted !== true);

        return wasBlacklisted === true
            ? this.success(`${channel.mention} is no longer blacklisted.`)
            : this.success(`${channel.mention} is now blacklisted`);
    }
}
