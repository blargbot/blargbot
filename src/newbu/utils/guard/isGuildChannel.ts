import { AnyChannel, AnyGuildChannel } from 'eris';

export function isGuildChannel<T extends AnyChannel>(channel: T): channel is AnyGuildChannel & T {
    return typeof channel === 'object' && channel !== null && 'guild' in channel;
}