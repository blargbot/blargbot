import { CommandContext } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { guard } from '@core/utils';
import { Channel, GuildChannel } from 'eris';

export function isGuildCommandContext<T extends Channel>(context: CommandContext<T>): context is GuildCommandContext<T & GuildChannel> {
    return guard.isGuildChannel(context.channel);
}
