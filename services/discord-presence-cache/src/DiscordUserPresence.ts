import type Discord from '@blargbot/discord-types';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DiscordUserPresence extends Partial<Omit<Discord.GatewayPresenceUpdateDispatchData, 'user' | 'guild_id'>> {
    user: undefined;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    guild_id: undefined;
}

export function toDiscordUserPresence(presence: Partial<Discord.GatewayPresenceUpdateDispatchData>): DiscordUserPresence {
    return {
        ...presence,
        user: undefined,
        guild_id: undefined
    };
}
