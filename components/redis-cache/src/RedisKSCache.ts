import type { RedisClientType } from 'redis';
import type { RedisLockProvider } from 'redis-lock';
import createRedisLock from 'redis-lock';

import type { ConditionalProp } from './ConditionalProp.js';
import type { IKSCache } from './IKSCache.js';
import type { ISerializer } from './ISerializer.js';

export class RedisKSCache<Key, Value> implements IKSCache<Key, Value> {
    readonly #redis: RedisClientType;
    readonly #expire: (key: string) => Promise<unknown>;
    readonly #toKey: (key: Key) => string;
    readonly #serializer: ISerializer<Value>;
    readonly #lock: RedisLockProvider;
    readonly #keyspace: string;

    public constructor(redis: RedisClientType, options: RedisKSCacheOptions<Key, Value>) {
        this.#redis = redis;
        this.#lock = createRedisLock(redis);
        const ttl = options.ttlS;
        this.#expire = ttl === null ? () => Promise.resolve() : k => this.#redis.expire(k, ttl);
        const toKey = options.keyFactory ?? (v => v.toString());
        const keyspace = this.#keyspace = options.keyspace;
        this.#toKey = v => `${keyspace}:${toKey(v)}`;
        this.#serializer = options.serializer ?? {
            read: value => JSON.parse(value) as Value,
            write: value => JSON.stringify(value)
        };
    }

    public async list(key: Key): Promise<Value[]> {
        const result = [];
        for await (const element of this.#redis.sScanIterator(this.#toKey(key)))
            result.push(this.#serializer.read(element));
        return result;
    }

    public async add(key: Key, value: Value): Promise<void> {
        const strKey = this.#toKey(key);
        const release = await this.#lock(strKey);
        try {
            await this.#redis.sAdd(strKey, this.#serializer.write(value));
            await this.#expire(strKey);
        } finally {
            await release();
        }
    }

    public async addAll(key: Key, values: Iterable<Value>): Promise<void> {
        const strKey = this.#toKey(key);
        const release = await this.#lock(strKey);
        try {
            await this.#redis.sAdd(strKey, Array.from(values, v => this.#serializer.write(v)));
            await this.#expire(strKey);
        } finally {
            await release();
        }
    }

    public async remove(key: Key, value: Value): Promise<void> {
        const strKey = this.#toKey(key);
        const release = await this.#lock(strKey);
        try {
            await this.#redis.sRem(strKey, this.#serializer.write(value));
            await this.#expire(strKey);
        } finally {
            await release();
        }
    }

    public async removeAll(key: Key, values: Iterable<Value>): Promise<void> {
        const strKey = this.#toKey(key);
        const release = await this.#lock(strKey);
        try {
            await this.#redis.sRem(strKey, Array.from(values, v => this.#serializer.write(v)));
            await this.#expire(strKey);
        } finally {
            await release();
        }
    }

    public async has(key: Key, value: Value): Promise<boolean> {
        return await this.#redis.sIsMember(this.#toKey(key), this.#serializer.write(value));
    }

    public async hasAll(key: Key, values: Iterable<Value>): Promise<boolean> {
        const res = await this.#hasEach(key, values);
        return res.every(v => v);
    }

    public async hasAny(key: Key, values: Iterable<Value>): Promise<boolean> {
        const res = await this.#hasEach(key, values);
        return res.some(v => v);
    }

    async #hasEach(key: Key, values: Iterable<Value>): Promise<boolean[]> {
        return await this.#redis.smIsMember(this.#toKey(key), Array.from(values, v => this.#serializer.write(v)));
    }

    public async clear(key?: Key): Promise<void> {
        if (key === undefined) {
            const ops = new Set();
            for await (const element of this.#redis.scanIterator({ MATCH: `${this.#keyspace}:*`, TYPE: 'set' })) {
                const p = this.#redis.del(element).catch(() => 0);
                ops.add(p);
                p.finally(ops.delete.bind(ops, p));
            }
            await Promise.all(ops);
        } else {
            const strKey = this.#toKey(key);
            const release = await this.#lock(strKey);
            try {
                await this.#redis.del(this.#toKey(key));
            } finally {
                await release();
            }
        }
    }

    public async size(key?: Key): Promise<number> {
        if (key !== undefined) {
            return await this.#redis.sCard(this.#toKey(key));
        }
        let size = 0;
        for await (const _ of this.#redis.scanIterator({ MATCH: `${this.#keyspace}:*`, TYPE: 'set' }))
            size++;
        return size;
    }
}

export type RedisKSCacheOptions<Key, Value> = RedisKSCacheOptionsBase<Value>
    & ConditionalProp<'keyFactory', Key, string, string | number | bigint | boolean>

interface RedisKSCacheOptionsBase<Value> {
    readonly keyspace: string;
    readonly ttlS: number | null;
    readonly serializer?: ISerializer<Value>;
}
