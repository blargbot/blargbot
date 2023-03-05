import type { IKVCache } from '@blargbot/redis-cache';
import type { UserSettings } from '@blargbot/user-settings-contract';

import { defaultSettings } from './defaultSettings.js';
import type { IUserSettingsDatabase } from './IUserSettingsDatabase.js';

export class UserSettingsService {
    readonly #database: IUserSettingsDatabase;
    readonly #cache: IKVCache<bigint, UserSettings>;

    public constructor(database: IUserSettingsDatabase, cache: IKVCache<bigint, UserSettings>) {
        this.#database = database;
        this.#cache = cache;
    }

    public async getSettings(userId: bigint): Promise<UserSettings> {
        let result = await this.#cache.get(userId);
        if (result === undefined)
            await this.#cache.set(userId, result = await this.#getSettings(userId));

        return result;
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
