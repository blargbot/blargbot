import * as Eris from 'eris';

import { isWellKnownChannel } from './isWellKnownChannel.js';

export function isWellKnownMessage<C extends Eris.PossiblyUncachedTextableChannel>(message: Eris.Message<C>): message is Eris.Message<C & Eris.KnownTextableChannel> {
    return isWellKnownChannel(message.channel);
}
