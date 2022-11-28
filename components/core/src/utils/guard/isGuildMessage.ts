import { KnownGuildTextableChannel, KnownMessage, Message, PossiblyUncachedGuildMessage, PossiblyUncachedMessage } from 'eris';

import { isGuildChannel } from './isGuildChannel';

export function isGuildMessage<T extends KnownMessage>(message: T): message is T & Message<KnownGuildTextableChannel>;
export function isGuildMessage<T extends PossiblyUncachedMessage>(message: T): message is T & PossiblyUncachedGuildMessage;
export function isGuildMessage<T extends PossiblyUncachedMessage>(message: T): message is T & PossiblyUncachedGuildMessage {
    return isGuildChannel(message.channel);
}
