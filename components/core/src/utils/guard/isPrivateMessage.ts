import type * as Eris from 'eris';

import { isPrivateChannel } from './isPrivateChannel.js';

export function isPrivateMessage(message: Eris.Message): message is Eris.Message<Eris.KnownPrivateChannel> {
    return isPrivateChannel(message.channel);
}
