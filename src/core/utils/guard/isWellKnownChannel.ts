import * as eris from 'eris';

export function isWellKnownChannel<T extends eris.PossiblyUncachedTextableChannel>(channel: T): channel is T & eris.KnownChannel {
    return channel instanceof eris.Channel;
}
