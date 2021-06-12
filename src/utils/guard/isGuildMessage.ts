import { Channel, GuildMessage, Message, Textable } from 'eris';
import { isGuildChannel } from './isGuildChannel';

export function isGuildMessage<T extends Channel>(message: Message<T & Textable>): message is GuildMessage & Message<T & Textable> {
    return isGuildChannel(message.channel);
}