import type { IKVCache } from '@blargbot/redis-cache';

import { defaultSettings } from './defaultSettings.js';
import type { IUserSettingsDatabase } from './IUserSettingsDatabase.js';
import type { UserSettings } from './UserSettings.js';

export class UserSettingsService {
    readonly #database: IUserSettingsDatabase;
    readonly #cache: IKVCache<bigint, UserSettings>;

    public constructor(database: IUserSettingsDatabase, cache: IKVCache<bigint, UserSettings>) {
        this.#database = database;
        this.#cache = cache;
    }

    public async getSettings(userId: bigint): Promise<UserSettings> {
        return await this.#cache.getOrAdd(userId, this.#getSettings.bind(this));
    }

    public async updateSettings(userId: bigint, value: Partial<UserSettings>): Promise<void> {
        await this.#database.update(userId, value);
        await this.#cache.delete(userId);
    }

    public async clearSettings(userId: bigint): Promise<void> {
        await this.#database.delete(userId);
        await this.#cache.delete(userId);
    }

    async #getSettings(userId: bigint): Promise<UserSettings> {
        return await this.#database.get(userId) ?? defaultSettings();
    }
}
