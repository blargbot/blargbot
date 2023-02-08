import type { RedisClientType } from 'redis';

import type { IUserSettingsCache } from './IUserSettingsCache.js';
import type { UserSettings } from './UserSettings.js';

export class UserSettingsRedisCache implements IUserSettingsCache {
    readonly #redis: RedisClientType;
    readonly #ttlS: number;

    public constructor(redis: RedisClientType, options: UserSettingsRedisCacheOptions) {
        this.#redis = redis;
        this.#ttlS = options.ttlS;
    }

    public async upsert(userId: bigint, factory: (userId: bigint) => Awaitable<UserSettings>): Promise<UserSettings> {
        const key = this.#toKey(userId);
        const resultJSON = await this.#redis.get(key);
        if (resultJSON !== null)
            return JSON.parse(resultJSON) as unknown as UserSettings;

        const value = await factory(userId);
        await this.#redis.set(key, JSON.stringify(value), { EX: this.#ttlS });
        return value;
    }

    public async delete(userId: bigint): Promise<void> {
        await this.#redis.del(this.#toKey(userId));
    }

    #toKey(userId: bigint): string {
        return `user_settings:${userId}`;
    }
}

export interface UserSettingsRedisCacheOptions {
    readonly ttlS: number;
}
