import { Channel, GuildChannel, Textable } from 'eris';
import { isGuildChannel } from './isGuildChannel';

export function isGuildRelated<T extends { channel: C; }, C extends Textable & Channel>(obj: T): obj is T & { channel: C & GuildChannel; } {
    return isGuildChannel(obj.channel);
}