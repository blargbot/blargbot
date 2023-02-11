import type { IKVCache } from '@blargbot/redis-cache';

import { defaultSettings } from './defaultSettings.js';
import type { GuildSettings } from './GuildSettings.js';
import type { IGuildSettingsDatabase } from './IGuildSettingsDatabase.js';

export class GuildSettingsService {
    readonly #database: IGuildSettingsDatabase;
    readonly #cache: IKVCache<bigint, GuildSettings>;

    public constructor(database: IGuildSettingsDatabase, cache: IKVCache<bigint, GuildSettings>) {
        this.#database = database;
        this.#cache = cache;
    }

    public async getSettings(guildId: bigint): Promise<GuildSettings> {
        return await this.#cache.getOrAdd(guildId, this.#getSettings.bind(this));
    }

    public async updateSettings(guildId: bigint, value: Partial<GuildSettings>): Promise<void> {
        await this.#database.update(guildId, value);
        await this.#cache.delete(guildId);
    }

    public async clearSettings(guildId: bigint): Promise<void> {
        await this.#database.delete(guildId);
        await this.#cache.delete(guildId);
    }

    async #getSettings(guildId: bigint): Promise<GuildSettings> {
        return await this.#database.get(guildId) ?? defaultSettings();
    }
}
