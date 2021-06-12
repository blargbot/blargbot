import { Channel, ChannelMessage, GuildChannel, GuildMessage } from 'eris';
import { isGuildChannel } from './isGuildChannel';

export function isGuildMessage<T extends Channel>(message: ChannelMessage<T>): message is GuildMessage<T & GuildChannel> {
    return isGuildChannel(message.channel);
}

