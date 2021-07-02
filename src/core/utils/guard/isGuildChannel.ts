import { Channel, GuildChannel } from 'eris';

export function isGuildChannel<T extends Channel>(channel: T): channel is GuildChannel & T {
    return typeof channel === 'object' && channel !== null && 'guild' in channel;
}