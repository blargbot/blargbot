import type { RedisClientType } from 'redis';
import type { RedisLockProvider } from 'redis-lock';
import createRedisLock from 'redis-lock';

import type { ConditionalProp } from './ConditionalProp.js';
import type { IKKVCache } from './IKKVCache.js';
import type { ISerializer } from './ISerializer.js';

export class RedisKKVCache<Key1, Key2, Value> implements IKKVCache<Key1, Key2, Value> {
    readonly #redis: RedisClientType;
    readonly #expire: (key: string) => Promise<unknown>;
    readonly #toKey1: (key: Key1) => string;
    readonly #serializer: ISerializer<Value>;
    readonly #lock: RedisLockProvider;
    readonly #keyspace: string;
    readonly #toKey2: (key: Key2) => string;
    readonly #fromKey2: (key: string) => Key2;

    public constructor(redis: RedisClientType, options: RedisKKVCacheOptions<Key1, Key2, Value>) {
        this.#redis = redis;
        this.#lock = createRedisLock(redis);
        const ttl = options.ttlS;
        this.#expire = ttl === null ? () => Promise.resolve() : k => this.#redis.expire(k, ttl);
        const toKey1 = options.key1Factory ?? (v => v.toString());
        const toKey2 = options.key2Factory ?? (v => v.toString());
        const fromKey2 = options.key2Reader ?? (v => v as Key2);
        const keyspace = this.#keyspace = options.keyspace;
        this.#toKey1 = v => `${keyspace}:${toKey1(v)}`;
        this.#toKey2 = toKey2;
        this.#fromKey2 = fromKey2;
        this.#serializer = options.serializer ?? {
            read: value => JSON.parse(value) as Value,
            write: value => JSON.stringify(value)
        };
    }

    public get(key1: Key1, key2: Key2): Promise<Value | undefined> {
        return this.#get(this.#toKey1(key1), this.#toKey2(key2));
    }

    async #get(key1: string, key2: string): Promise<Value | undefined> {
        const resultStr = await this.#redis.hGet(key1, key2);
        if (resultStr === undefined)
            return undefined;
        return this.#serializer.read(resultStr);
    }

    public getAll(key1: Key1): Promise<Map<Key2, Value>> {
        return this.#getAll(this.#toKey1(key1));
    }

    async #getAll(key1: string): Promise<Map<Key2, Value>> {
        const result = await this.#redis.hGetAll(key1);
        return this.#toMap(result);
    }

    public async set(key1: Key1, key2: Key2, value: Value): Promise<void> {
        const strKey = this.#toKey1(key1);
        const release = await this.#lock(strKey);
        try {
            await this.#set(strKey, this.#toKey2(key2), value);
        } finally {
            await release();
        }
    }

    async #set(key1: string, key2: string, value: Value): Promise<void> {
        await this.#redis.hSet(key1, key2, this.#serializer.write(value));
        await this.#expire(key1);
    }

    public async setAll(key1: Key1, entries: Iterable<[key2: Key2, value: Value]>): Promise<void> {
        const strKey = this.#toKey1(key1);
        const release = await this.#lock(strKey);
        try {
            await this.#setAll(strKey, this.#toRecord(entries));
        } finally {
            await release();
        }
    }

    async #setAll(key1: string, entries: Record<string, string>): Promise<void> {
        await this.#redis.hSet(key1, entries);
        await this.#expire(key1);
    }

    public async getOrAdd(key1: Key1, key2: Key2, factory: (key1: Key1, key2: Key2) => Awaitable<Value>): Promise<Value> {
        const strKey1 = this.#toKey1(key1);
        const strKey2 = this.#toKey2(key2);
        let result = await this.#get(strKey1, strKey2);
        if (result === undefined) {
            const release = await this.#lock(strKey1);
            try {
                await this.#set(strKey1, strKey2, result = await factory(key1, key2));
            } finally {
                await release();
            }
        }
        return result;
    }

    public async getOrAddAll(key1: Key1, keys: Iterable<Key2>, factory: (key1: Key1, key2: Key2) => Awaitable<Value>): Promise<Map<Key2, Value>>;
    public async getOrAddAll(key1: Key1, entries: Iterable<[key2: Key2, value: (key1: Key1, key2: Key2) => Awaitable<Value>]>): Promise<Map<Key2, Value>>;
    public async getOrAddAll(key1: Key1, ...args: [entries: Iterable<[key2: Key2, value: (key1: Key1, key2: Key2) => Awaitable<Value>]>] | [keys: Iterable<Key2>, factory: (key1: Key1, key2: Key2) => Awaitable<Value>]): Promise<Map<Key2, Value>> {
        const entries = args.length === 1 ? args[0] : Array.from(args[0], e => [e, args[1]] as const);
        const strKey1 = this.#toKey1(key1);
        const dict = await this.#redis.hGetAll(strKey1);
        const result = this.#toMap(dict);
        const toSet = new Map();
        await Promise.all(Array.from(entries, async ([key2, factory]) => {
            const strKey2 = this.#toKey2(key2);
            if (strKey2 in dict)
                return;

            const value = await factory(key1, key2);
            toSet.set(key2, value);
            result.set(key2, value);
        }));
        if (toSet.size > 0) {
            const release = await this.#lock(strKey1);
            try {
                await this.#setAll(strKey1, this.#toRecord(toSet));
            } finally {
                await release();
            }
        }
        return result;
    }

    public async delete(key1: Key1, key2: Key2): Promise<void> {
        const strKey = this.#toKey1(key1);
        const release = await this.#lock(strKey);
        try {
            await this.#redis.hDel(strKey, this.#toKey2(key2));
        } finally {
            await release();
        }
    }

    public async deleteAll(key1: Key1): Promise<void> {
        const strKey = this.#toKey1(key1);
        const release = await this.#lock(strKey);
        try {
            await this.#redis.del(strKey);
        } finally {
            await release();
        }
    }

    public async clear(): Promise<void> {
        const ops = new Set();
        for await (const element of this.#redis.scanIterator({ MATCH: `${this.#keyspace}:*`, TYPE: 'hash' })) {
            const p = this.#redis.del(element).catch(() => 0);
            ops.add(p);
            p.finally(ops.delete.bind(ops, p));
        }
        await Promise.all(ops);
    }

    public async size(key1: Key1): Promise<number> {
        let size = 0;
        for await (const _ of this.#redis.hScanIterator(this.#toKey1(key1)))
            size++;

        return size;
    }

    public async upsert(key1: Key1, key2: Key2, update: Value, merge: (update: Value, current: Value) => Value): Promise<Value> {
        const strKey1 = this.#toKey1(key1);
        const release = await this.#lock(strKey1);
        try {
            const strKey2 = this.#toKey2(key2);
            const current = await this.#get(strKey1, strKey2);
            const result = current === undefined ? update : merge(update, current);
            await this.#set(strKey1, strKey2, result);
            return result;
        } finally {
            await release();
        }
    }

    public async upsertAll(key1: Key1, getUpdates: (current: Map<Key2, Value>) => Iterable<[Key2, Value]>): Promise<Map<Key2, Value>> {
        const strKey1 = this.#toKey1(key1);
        const release = await this.#lock(strKey1);
        try {
            const current = await this.#getAll(strKey1);
            const toSet = new Map();
            for (const [key2, value] of getUpdates(current)) {
                toSet.set(key2, value);
                current.set(key2, value);
            }
            await this.#setAll(strKey1, this.#toRecord(toSet));
            return current;
        } finally {
            await release();
        }
    }

    #toRecord(items: Iterable<[Key2, Value]>): Record<string, string> {
        return Object.fromEntries(this.#toEntries(items));
    }

    *#toEntries(items: Iterable<[Key2, Value]>): Iterable<[string, string]> {
        for (const [key, value] of items)
            yield [this.#toKey2(key), this.#serializer.write(value)];
    }

    #toMap(items: Record<string, string>): Map<Key2, Value> {
        return new Map(Object.entries(items)
            .map(e => [this.#fromKey2(e[0]), this.#serializer.read(e[1])]));
    }
}

export type RedisKKVCacheOptions<Key1, Key2, Value> = RedisKKVCacheOptionsBase<Value>
    & ConditionalProp<'key1Factory', Key1, string, string | number | bigint | boolean>
    & ConditionalProp<'key2Factory', Key2, string, string | number | bigint | boolean>
    & ConditionalProp<'key2Reader', string, Key2, string>

interface RedisKKVCacheOptionsBase<Value> {
    readonly keyspace: string;
    readonly ttlS: number | null;
    readonly serializer?: ISerializer<Value>;
}
