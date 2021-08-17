import { AnyChannel, GuildChannels } from 'discord.js';

import { isGuildChannel } from './isGuildChannel';

export function isGuildRelated<T extends { channel: AnyChannel; }>(obj: T): obj is T & { channel: T['channel'] & GuildChannels; } {
    return isGuildChannel(obj.channel);
}
