import { CommandContext } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { guard } from '@core/utils';
import { GuildChannels, TextBasedChannels } from 'discord.js';

export function isGuildCommandContext<T extends TextBasedChannels>(context: CommandContext<T>): context is GuildCommandContext<T & GuildChannels> {
    return guard.isGuildChannel(context.channel);
}
