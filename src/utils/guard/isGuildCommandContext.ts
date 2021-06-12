import { Channel, GuildChannel } from 'eris';
import { CommandContext } from '../../core/command';
import { isGuildChannel } from './isGuildChannel';

export function isGuildCommandContext<T extends Channel>(context: CommandContext<T>): context is CommandContext<T & GuildChannel> {
    return isGuildChannel(context.channel);
}