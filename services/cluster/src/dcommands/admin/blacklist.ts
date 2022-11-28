import { GuildCommand } from '../../command/index';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType } from '@blargbot/cluster/utils';
import { guard } from '@blargbot/core/utils';
import Eris from 'eris';

import templates from '../../text';

const cmd = templates.commands.blacklist;

export class BlacklistCommandBase extends GuildCommand {
    public constructor() {
        super({
            name: 'blacklist',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: '{channel:channel+?}',
                    description: cmd.default.description,
                    execute: (ctx, [channel]) => this.blacklist(ctx, channel.asOptionalChannel ?? ctx.channel)
                }
            ]
        });
    }

    public async blacklist(context: GuildCommandContext, channel: Eris.KnownChannel): Promise<CommandResult> {
        if (!guard.isGuildChannel(channel) || channel.guild !== context.channel.guild)
            return cmd.default.notInServer;

        const wasBlacklisted = await context.cluster.database.guilds.getChannelSetting(context.channel.guild.id, channel.id, 'blacklisted') ?? false;
        await context.cluster.database.guilds.setChannelSetting(context.channel.guild.id, channel.id, 'blacklisted', !wasBlacklisted);

        return cmd.default.success[wasBlacklisted ? 'added' : 'removed']({ channel });
    }
}
