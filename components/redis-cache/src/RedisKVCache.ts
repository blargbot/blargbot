import type { RedisClientType } from 'redis';

import type { IKVCache } from './IKVCache.js';
import type { ISerializer } from './ISerializer.js';

export class RedisKVCache<Key, Value> implements IKVCache<Key, Value> {
    readonly #redis: RedisClientType;
    readonly #ttlS: number;
    readonly #toKey: (key: Key) => string;
    readonly #serializer: ISerializer<Value>;

    public constructor(redis: RedisClientType, options: RedisKVCacheOptions<Key, Value>) {
        this.#redis = redis;
        this.#ttlS = options.ttlS;
        this.#toKey = options.keyFactory;
        this.#serializer = options.serializer ?? {
            read: value => JSON.parse(value) as Value,
            write: value => JSON.stringify(value)
        };
    }

    public get(key: Key): Promise<Value | undefined> {
        return this.#get(this.#toKey(key));
    }

    async #get(key: string): Promise<Value | undefined> {
        const resultStr = await this.#redis.get(key);
        if (resultStr === null)
            return undefined;
        return this.#serializer.read(resultStr);
    }

    public set(key: Key, value: Value): Promise<void> {
        return this.#set(this.#toKey(key), value);
    }

    async #set(key: string, value: Value): Promise<void> {
        await this.#redis.set(key, this.#serializer.write(value), { EX: this.#ttlS });
    }

    public async getOrAdd(key: Key, factory: (key: Key) => Awaitable<Value>): Promise<Value> {
        const strKey = this.#toKey(key);
        let result = await this.#get(strKey);
        if (result === undefined)
            await this.#set(strKey, result = await factory(key));
        return result;
    }

    public async delete(key: Key): Promise<void> {
        await this.#redis.del(this.#toKey(key));
    }
}

export interface RedisKVCacheOptions<Key, Value> {
    readonly ttlS: number;
    readonly keyFactory: (key: Key) => string;
    readonly serializer?: ISerializer<Value>;
}
