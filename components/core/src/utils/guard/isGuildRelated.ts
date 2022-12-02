import Eris from 'eris';

import { isGuildChannel } from './isGuildChannel.js';

export function isGuildRelated<T extends { channel: C; }, C extends Eris.KnownChannel>(obj: T): obj is T & { channel: C & Eris.KnownGuildChannel; } {
    return isGuildChannel(obj.channel);
}
