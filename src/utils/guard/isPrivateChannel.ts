import { Channel, PrivateChannel } from 'eris';

export function isPrivateChannel<T extends Channel>(channel: T): channel is PrivateChannel & T {
    return typeof channel === 'object' && channel !== null && 'recipient' in channel;
}