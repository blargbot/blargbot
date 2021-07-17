import { Channel, Message, PrivateMessage, Textable } from 'eris';

import { isPrivateChannel } from './isPrivateChannel';

export function isPrivateMessage<T extends Channel>(message: Message<T & Textable>): message is PrivateMessage & Message<T & Textable> {
    return isPrivateChannel(message.channel);
}
