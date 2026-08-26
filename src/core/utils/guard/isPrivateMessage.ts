import type * as eris from 'eris';

import { isPrivateChannel } from './isPrivateChannel.js';

export function isPrivateMessage(message: eris.Message): message is eris.Message<eris.KnownPrivateChannel> {
    return isPrivateChannel(message.channel);
}
