import type * as eris from 'eris';

import { isWellKnownChannel } from './isWellKnownChannel.js';

export function isWellKnownMessage<C extends eris.PossiblyUncachedTextableChannel>(message: eris.Message<C>): message is eris.Message<C & eris.KnownTextableChannel> {
    return isWellKnownChannel(message.channel);
}
