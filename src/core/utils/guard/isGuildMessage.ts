import type * as eris from 'eris';

import { isGuildChannel } from './isGuildChannel.js';

export function isGuildMessage<T extends eris.KnownMessage>(message: T): message is T & eris.Message<eris.KnownGuildTextableChannel>;
export function isGuildMessage<T extends eris.PossiblyUncachedMessage>(message: T): message is T & eris.PossiblyUncachedGuildMessage;
export function isGuildMessage<T extends eris.PossiblyUncachedMessage>(message: T): message is T & eris.PossiblyUncachedGuildMessage {
    return isGuildChannel(message.channel);
}
