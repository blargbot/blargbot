import { Channel, PrivateChannel } from 'eris';
import { hasValue } from './hasValue';

export function isPrivateChannel<T extends Channel>(channel: T): channel is PrivateChannel & T {
    return typeof channel === 'object' && hasValue(channel) && 'recipient' in channel;
}
