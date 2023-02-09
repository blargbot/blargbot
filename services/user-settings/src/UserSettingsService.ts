import { defaultSettings } from './defaultSettings.js';
import type { IUserSettingsCache } from './IUserSettingsCache.js';
import type { IUserSettingsDatabase } from './IUserSettingsDatabase.js';
import type { UserSettings } from './UserSettings.js';

export class UserSettingsService {
    readonly #database: IUserSettingsDatabase;
    readonly #cache: IUserSettingsCache;

    public constructor(database: IUserSettingsDatabase, cache: IUserSettingsCache) {
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
