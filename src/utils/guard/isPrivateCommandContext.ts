import { Channel, PrivateChannel } from 'eris';
import { CommandContext } from '../../core/command';
import { isPrivateChannel } from './isPrivateChannel';

export function isPrivateCommandContext<T extends Channel>(context: CommandContext<T>): context is CommandContext<T & PrivateChannel> {
    return isPrivateChannel(context.channel);
}