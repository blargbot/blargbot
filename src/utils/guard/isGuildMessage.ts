import { GuildTextableChannel, Message, TextableChannel } from 'eris';
import { isGuildChannel } from './isGuildChannel';

type GuildMessageType<T extends { channel: C }, C extends TextableChannel> =
    T extends Message<C> ? T & Message<C & GuildTextableChannel> : T & { channel: C & GuildTextableChannel };

export function isGuildMessage<T extends { channel: C }, C extends TextableChannel>(message: T): message is GuildMessageType<T, C> {
    return isGuildChannel(message.channel);
}
