import { isPrivateChannel } from '@blargbot/discord-util';
import type * as Eris from 'eris';

export function isPrivateMessage(message: Eris.Message): message is Eris.Message<Eris.KnownPrivateChannel> {
    return isPrivateChannel(message.channel);
}
