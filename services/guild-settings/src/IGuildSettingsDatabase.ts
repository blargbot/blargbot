import type { GuildSettings } from '@blargbot/guild-settings-contract';

export interface IGuildSettingsDatabase {
    get(guildId: bigint): Awaitable<GuildSettings | undefined>;
    update(guildId: bigint, value: Partial<GuildSettings>): Awaitable<void>;
    delete(guildId: bigint): Awaitable<void>;
}
