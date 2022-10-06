import { ClusterUtilities } from '@blargbot/cluster';
import { guard, parse } from '@blargbot/core/utils';
import { StoredGuildSettings } from '@blargbot/domain/models';
import { UserChannelInteraction } from 'eris';

import { guildSettings } from '../constants';

export async function guildSetting<T extends Exclude<keyof StoredGuildSettings, `prefix` | `farewell` | `greeting`>>(
    msg: UserChannelInteraction,
    util: ClusterUtilities,
    key: T,
    raw: string | undefined
): Promise<{ success: true; value: StoredGuildSettings[T]; display: string | undefined; } | { success: false; }> {
    const def = guildSettings[key];
    if (raw === undefined || raw.length === 0)
        return { success: true, value: undefined, display: undefined };

    switch (def.type) {
        case `string`: return {
            success: true,
            value: <StoredGuildSettings[T]>raw,
            display: `\`${raw}\``
        };
        case `float`: {
            const val = parse.float(raw, { strict: true });
            return {
                success: val !== undefined,
                value: <StoredGuildSettings[T]>val,
                display: `\`${val ?? NaN}\``
            };
        }
        case `int`: {
            const val = parse.int(raw, { strict: true });
            return {
                success: val !== undefined,
                value: <StoredGuildSettings[T]>val,
                display: `\`${val ?? NaN}\``
            };
        }
        case `permission`: {
            const val = parse.bigInt(raw);
            return {
                success: val !== undefined,
                value: <StoredGuildSettings[T]>val?.toString(),
                display: `\`${val ?? raw}\``
            };
        }
        case `bool`: {
            const val = parse.boolean(raw, undefined);
            return {
                success: val !== undefined,
                value: <StoredGuildSettings[T]>val,
                display: `\`${val ?? `undefined`}\``
            };
        }
        case `channel`: {
            if (!guard.isGuildRelated(msg))
                return { success: false };
            const result = await util.queryChannel({ context: msg.channel, actors: msg.author, guild: msg.channel.guild, filter: raw });
            if (result.state !== `SUCCESS`)
                return { success: false };
            return {
                success: true,
                value: result.value.id as StoredGuildSettings[T],
                display: result.value.mention
            };
        }
        case `role`: {
            if (!guard.isGuildRelated(msg))
                return { success: false };
            const result = await util.queryRole({ context: msg.channel, actors: msg.author, guild: msg.channel.guild, filter: raw });
            if (result.state !== `SUCCESS`)
                return { success: false };
            return {
                success: true,
                value: result.value.id as StoredGuildSettings[T],
                display: result.value.mention
            };
        }
        default:
            return def;
    }
}
