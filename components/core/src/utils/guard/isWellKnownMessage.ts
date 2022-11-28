import { KnownTextableChannel, Message, PossiblyUncachedTextableChannel } from 'eris';

import { isWellKnownChannel } from './isWellKnownChannel';

export function isWellKnownMessage<C extends PossiblyUncachedTextableChannel>(message: Message<C>): message is Message<C & KnownTextableChannel> {
    return isWellKnownChannel(message.channel);
}
