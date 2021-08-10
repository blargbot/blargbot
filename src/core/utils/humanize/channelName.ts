import { guard } from '@core/utils';
import { AllChannels } from 'discord.js';

import { fullName } from './fullName';

export function channelName(channel: AllChannels): string {
    if (guard.isGuildChannel(channel))
        return channel.name;
    if (guard.isPrivateChannel(channel) && 'recipient' in channel)
        return `${fullName(channel.recipient)} (DM)`;

    return `${channel.id} (UNKNOWN)`;
}
