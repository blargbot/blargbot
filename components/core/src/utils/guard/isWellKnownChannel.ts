import { Channel, KnownChannel, PossiblyUncachedTextableChannel } from 'eris';

export function isWellKnownChannel<T extends PossiblyUncachedTextableChannel>(channel: T): channel is T & KnownChannel {
    return channel instanceof Channel;
}
