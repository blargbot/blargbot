import { CommandContext } from '@cluster/command';
import { PrivateCommandContext } from '@cluster/types';
import { guard } from '@core/utils';
import { PrivateChannels, TextBasedChannels } from 'discord.js';

export function isPrivateCommandContext<T extends TextBasedChannels>(context: CommandContext<T>): context is PrivateCommandContext<T & PrivateChannels> {
    return guard.isPrivateChannel(context.channel);
}
