import type * as eris from 'eris';

export function isGuildChannel<T extends eris.Channel>(channel: T): channel is T & eris.KnownGuildChannel;
export function isGuildChannel<T extends eris.Channel | eris.PossiblyUncachedMessage['channel']>(channel: T): channel is T & { guild: { id: string; }; }
export function isGuildChannel<T extends eris.Channel | eris.PossiblyUncachedMessage['channel']>(channel: T): channel is T & { guild: { id: string; }; } {
    return 'guild' in channel && channel.guild?.id !== undefined;
}
