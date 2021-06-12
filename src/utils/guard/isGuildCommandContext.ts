import { Channel, GuildTextableChannel, Textable } from 'eris';
import { CommandContext } from '../../core/command';
import { isGuildChannel } from './isGuildChannel';


export function isGuildCommandContext<T extends Textable & Channel>(context: CommandContext<T>): context is CommandContext<T & GuildTextableChannel> {
    return isGuildChannel(context.channel);
}
