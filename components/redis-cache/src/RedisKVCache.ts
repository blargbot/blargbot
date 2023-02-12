import type { RedisClientType } from 'redis';
import type { RedisLockProvider } from 'redis-lock';
import createRedisLock from 'redis-lock';

import type { IKVCache } from './IKVCache.js';
import type { ISerializer } from './ISerializer.js';

export class RedisKVCache<Key, Value> implements IKVCache<Key, Value> {
    readonly #redis: RedisClientType;
    readonly #ttlS?: number;
    readonly #toKey: (key: Key) => string;
    readonly #serializer: ISerializer<Value>;
    readonly #lock: RedisLockProvider;
    readonly #keyspace: string;

    public constructor(redis: RedisClientType, options: RedisKVCacheOptions<Key, Value>) {
        this.#redis = redis;
        this.#lock = createRedisLock(redis);
        this.#ttlS = options.ttlS ?? undefined;
        const toKey = options.keyFactory ?? (v => v.toString());
        const keyspace = this.#keyspace = options.keyspace;
        this.#toKey = v => `${keyspace}:${toKey(v)}`;
        this.#serializer = options.serializer ?? {
            read: value => JSON.parse(value) as Value,
            write: value => JSON.stringify(value)
        };
    }

    public async size(): Promise<number> {
        let size = 0;
        for await (const _ of this.#redis.scanIterator({ MATCH: `${this.#keyspace}:*` }))
            size++;
        return size;
    }

    public async clear(): Promise<void> {
        const ops = new Set();
        for await (const element of this.#redis.scanIterator({ MATCH: `${this.#keyspace}:*` })) {
            const p = this.#redis.del(element).catch(() => 0);
            ops.add(p);
            p.finally(ops.delete.bind(ops, p));
        }
        await Promise.all(ops);
    }

    public async upsert(key: Key, update: Value, merge: (update: Value, current: Value) => Value): Promise<Value> {
        const strKey = this.#toKey(key);
        const release = await this.#lock(strKey);
        try {
            const current = await this.#get(strKey);
            const result = current === undefined ? update : merge(update, current);
            await this.#set(strKey, result);
            return result;
        } finally {
            await release();
        }
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

    public async set(key: Key, value: Value): Promise<void> {
        const strKey = this.#toKey(key);
        const release = await this.#lock(strKey);
        try {
            return await this.#set(strKey, value);
        } finally {
            await release();
        }
    }

    async #set(key: string, value: Value): Promise<void> {
        await this.#redis.set(key, this.#serializer.write(value), { EX: this.#ttlS });
    }

    public async getOrAdd(key: Key, factory: (key: Key) => Awaitable<Value>): Promise<Value> {
        const strKey = this.#toKey(key);
        const release = await this.#lock(strKey);
        try {
            let result = await this.#get(strKey);
            if (result === undefined)
                await this.#set(strKey, result = await factory(key));
            return result;
        } finally {
            await release();
        }
    }

    public async delete(key: Key): Promise<void> {
        const strKey = this.#toKey(key);
        const release = await this.#lock(strKey);
        try {
            await this.#redis.del(strKey);
        } finally {
            await release();
        }
    }
}

type RedisKVCacheOptions<Key, Value> = RedisKVCacheOptionsBase<Value>
    & (Key extends string | number | bigint | boolean
        ? { readonly keyFactory?: (key: Key) => string; }
        : { readonly keyFactory: (key: Key) => string; })

export interface RedisKVCacheOptionsBase<Value> {
    readonly keyspace: string;
    readonly ttlS: number | null;
    readonly serializer?: ISerializer<Value>;
}
