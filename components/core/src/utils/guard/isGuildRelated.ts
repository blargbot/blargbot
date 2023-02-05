import { isGuildChannel } from '@blargbot/discord-util';
import type * as Eris from 'eris';

export function isGuildRelated<T extends { channel: C; }, C extends Eris.KnownChannel>(obj: T): obj is T & { channel: C & Eris.KnownGuildChannel; } {
    return isGuildChannel(obj.channel);
}
