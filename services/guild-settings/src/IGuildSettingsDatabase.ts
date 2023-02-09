import type { GuildSettings } from './GuildSettings.js';

export interface IGuildSettingsDatabase {
    get(guildId: bigint): Awaitable<GuildSettings | undefined>;
    update(guildId: bigint, value: Partial<GuildSettings>): Awaitable<void>;
    delete(guildId: bigint): Awaitable<void>;
}
