import type { GuildSettings } from './GuildSettings.js';

export interface IGuildSettingsCache {
    getOrAdd(guildId: bigint, factory: (guildId: bigint) => Awaitable<GuildSettings>): Awaitable<GuildSettings>;
    delete(guildId: bigint): Awaitable<void>;
}
