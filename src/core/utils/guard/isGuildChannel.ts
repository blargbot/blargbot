import { Channel, GuildChannel } from 'eris';
import { hasValue } from './hasValue';

export function isGuildChannel<T extends Channel>(channel: T): channel is GuildChannel & T {
    return typeof channel === 'object' && hasValue(channel) && 'guild' in channel;
}
