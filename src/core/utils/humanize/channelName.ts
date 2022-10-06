import { guard } from '@blargbot/core/utils';
import { KnownChannel } from 'eris';

import { fullName } from './fullName';

export function channelName(channel: KnownChannel): string {
    if (guard.isGuildChannel(channel))
        return channel.name;
    if (guard.isPrivateChannel(channel) && `recipient` in channel)
        return `${fullName(channel.recipient)} (DM)`;

    return channel; // never
}
