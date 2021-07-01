import { Channel, PrivateChannel } from 'eris';
import { CommandContext, PrivateCommandContext } from '../../core/command';
import { isPrivateChannel } from './isPrivateChannel';

export function isPrivateCommandContext<T extends Channel>(context: CommandContext<T>): context is PrivateCommandContext<T & PrivateChannel> {
    return isPrivateChannel(context.channel);
}