import { ClusterUtilities } from '@cluster';
import { StoredGuildSettings } from '@core/types';
import { guard, parse } from '@core/utils';
import { UserChannelInteraction } from 'discord.js';

import { guildSettings } from '../constants';

export async function guildSetting<T extends Exclude<keyof StoredGuildSettings, 'prefix' | 'farewell' | 'greeting'>>(
    msg: UserChannelInteraction,
    util: ClusterUtilities,
    key: T,
    raw: string | undefined
): Promise<{ success: true; value: StoredGuildSettings[T]; display: string | undefined; } | { success: false; }> {
    const def = guildSettings[key];
    if (raw === undefined || raw.length === 0)
        return { success: true, value: undefined, display: undefined };

    switch (def.type) {
        case 'string': return {
            success: true,
            value: <StoredGuildSettings[T]>raw,
            display: `\`${raw}\``
        };
        case 'int': {
            const val = parse.int(raw);
            return {
                success: !Number.isNaN(val),
                value: <StoredGuildSettings[T]>val,
                display: `\`${val}\``
            };
        }
        case 'bool': {
            const val = parse.boolean(raw, undefined);
            return {
                success: val !== undefined,
                value: <StoredGuildSettings[T]>val,
                display: `\`${val ?? 'undefined'}\``
            };
        }
        case 'channel': {
            if (!guard.isGuildRelated(msg))
                return { success: false };
            const result = await util.queryChannel(msg.channel, msg.author, msg.channel.guild, raw);
            if (typeof result === 'string')
                return { success: false };
            return {
                success: true,
                value: result.id as StoredGuildSettings[T],
                display: result.toString()
            };
        }
        case 'role': {
            if (!guard.isGuildRelated(msg))
                return { success: false };
            const result = await util.queryRole(msg.channel, msg.author, msg.channel.guild, raw);
            if (typeof result === 'string')
                return { success: false };
            return {
                success: true,
                value: result.id as StoredGuildSettings[T],
                display: result.toString()
            };
        }
    }
}
