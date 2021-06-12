import { Channel, GuildChannel, Message, Textable } from 'eris';
import { isGuildChannel } from './isGuildChannel';

export function isGuildMessage<T extends Textable & Channel>(message: Message<T>): message is Message<T & GuildChannel> {
    return isGuildChannel(message.channel);
}

