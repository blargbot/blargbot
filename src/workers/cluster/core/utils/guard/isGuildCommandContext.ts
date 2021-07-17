import { Channel, GuildChannel } from 'eris';
import { CommandContext } from '../../command';
import { guard } from '@core';
import { GuildCommandContext } from '../../types';

export function isGuildCommandContext<T extends Channel>(context: CommandContext<T>): context is GuildCommandContext<T & GuildChannel> {
    return guard.isGuildChannel(context.channel);
}
