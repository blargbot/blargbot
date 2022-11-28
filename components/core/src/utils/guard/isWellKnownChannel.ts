import Eris from 'eris';

export function isWellKnownChannel<T extends Eris.PossiblyUncachedTextableChannel>(channel: T): channel is T & Eris.KnownChannel {
    return channel instanceof Eris.Channel;
}
