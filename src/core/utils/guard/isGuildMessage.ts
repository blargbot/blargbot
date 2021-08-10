import { GuildMessage, GuildPartialMessage, Message, PartialMessage } from 'discord.js';

import { isGuildChannel } from './isGuildChannel';

export function isGuildMessage<T extends Message | PartialMessage>(message: T): message is T extends Message ? GuildMessage<T> : T extends PartialMessage ? GuildPartialMessage<T> : never {
    return isGuildChannel(message.channel);
}
