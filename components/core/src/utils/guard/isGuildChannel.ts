import type * as Eris from 'eris';

export function isGuildChannel<T extends Eris.Channel>(channel: T): channel is T & Eris.KnownGuildChannel;
export function isGuildChannel<T extends Eris.Channel | Eris.PossiblyUncachedMessage['channel']>(channel: T): channel is T & { guild: { id: string; }; }
export function isGuildChannel<T extends Eris.Channel | Eris.PossiblyUncachedMessage['channel']>(channel: T): channel is T & { guild: { id: string; }; } {
    return 'guild' in channel && channel.guild?.id !== undefined;
}
