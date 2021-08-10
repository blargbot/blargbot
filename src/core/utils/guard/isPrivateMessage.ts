import { Message, PrivateChannels } from 'discord.js';

import { isPrivateChannel } from './isPrivateChannel';

export function isPrivateMessage(message: Message): message is Message & { channel: PrivateChannels; } {
    return isPrivateChannel(message.channel);
}
