import { KnownChannel, KnownGuildChannel } from 'eris';

import { isGuildChannel } from './isGuildChannel';

export function isGuildRelated<T extends { channel: C; }, C extends KnownChannel>(obj: T): obj is T & { channel: C & KnownGuildChannel; } {
    return isGuildChannel(obj.channel);
}
