import { AnyChannel } from 'eris';

import { fullName } from './fullName';

export function channelName(channel: AnyChannel): string {
    if ('name' in channel)
        return channel.name;
    return `${fullName(channel.recipient)} (DM)`;
}
