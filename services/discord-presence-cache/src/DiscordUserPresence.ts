import type * as discordeno from 'discordeno';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DiscordUserPresence extends Partial<Omit<discordeno.DiscordPresenceUpdate, 'user' | 'guild_id'>> {
    user: undefined;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    guild_id: undefined;
}

export function toDiscordUserPresence(presence: Partial<discordeno.DiscordPresenceUpdate>): DiscordUserPresence {
    return {
        ...presence,
        user: undefined,
        guild_id: undefined
    };
}
