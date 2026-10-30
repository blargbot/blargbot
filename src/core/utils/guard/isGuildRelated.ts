import type * as eris from 'eris';

import { isGuildChannel } from './isGuildChannel.js';

export function isGuildRelated<T extends { channel: C; }, C extends eris.KnownChannel>(obj: T): obj is T & { channel: C & eris.KnownGuildChannel; } {
    return isGuildChannel(obj.channel);
}
