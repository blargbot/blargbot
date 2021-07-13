import { UserChannelInteraction } from 'eris';
import { ClusterUtilities } from '../../../ClusterUtilities';
import { StoredGuildSettings } from '../../globalCore';
import { guildSettings } from '../constants';
import { guard } from '../guard';
import { parse } from '../parse';

export async function guildSetting<T extends Exclude<keyof StoredGuildSettings, 'prefix' | 'farewell' | 'greeting'>>(
    msg: UserChannelInteraction,
    util: ClusterUtilities,
    key: T,
    raw: string
): Promise<{ success: true; value: StoredGuildSettings[T]; display: string | undefined; } | { success: false; }> {
    const def = guildSettings[key];
    if (raw.length === 0)
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
            const channel = await util.getChannel(msg, raw);
            return {
                success: channel !== undefined && guard.isTextableChannel(channel),
                value: <StoredGuildSettings[T]>channel?.id,
                display: channel?.mention
            };
        }
        case 'role': {
            if (!guard.isGuildRelated(msg))
                return { success: false };
            const role = await util.getRole(msg, raw);
            return {
                success: role !== undefined,
                value: <StoredGuildSettings[T]>role?.id,
                display: role === undefined ? undefined : `\`@${role.name} (${role.id})\``
            };
        }
    }
}
