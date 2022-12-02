import Eris from 'eris';

import { isGuildChannel } from './isGuildChannel.js';

export function isGuildMessage<T extends Eris.KnownMessage>(message: T): message is T & Eris.Message<Eris.KnownGuildTextableChannel>;
export function isGuildMessage<T extends Eris.PossiblyUncachedMessage>(message: T): message is T & Eris.PossiblyUncachedGuildMessage;
export function isGuildMessage<T extends Eris.PossiblyUncachedMessage>(message: T): message is T & Eris.PossiblyUncachedGuildMessage {
    return isGuildChannel(message.channel);
}
