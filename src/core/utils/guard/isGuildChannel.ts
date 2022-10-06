import { Channel, KnownGuildChannel, PossiblyUncachedMessage } from 'eris';

export function isGuildChannel<T extends Channel>(channel: T): channel is T & KnownGuildChannel;
export function isGuildChannel<T extends Channel | PossiblyUncachedMessage[`channel`]>(channel: T): channel is T & { guild: { id: string; }; }
export function isGuildChannel<T extends Channel | PossiblyUncachedMessage[`channel`]>(channel: T): channel is T & { guild: { id: string; }; } {
    return `guild` in channel && channel.guild?.id !== undefined;
}
