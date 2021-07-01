import { Channel, GuildChannel } from 'eris';
import { CommandContext, GuildCommandContext } from '../../core/command';
import { isGuildChannel } from './isGuildChannel';

export function isGuildCommandContext<T extends Channel>(context: CommandContext<T>): context is GuildCommandContext<T & GuildChannel> {
    return isGuildChannel(context.channel);
}