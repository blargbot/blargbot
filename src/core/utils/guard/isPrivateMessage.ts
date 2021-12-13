import { KnownPrivateChannel, Message } from 'eris';

import { isPrivateChannel } from './isPrivateChannel';

export function isPrivateMessage(message: Message): message is Message<KnownPrivateChannel> {
    return isPrivateChannel(message.channel);
}
