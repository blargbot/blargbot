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

    public async lock(...args: [key1: Key1, key2: Key2] | [key1: Key1]): Promise<() => Promise<void>> {
        return await this.#lock(args.length === 1
            ? this.#toKey1(args[0])
            : `${this.#toKey1(args[0])}:${this.#toKey2(args[1])}`);
    }

    public async get(key1: Key1, key2: Key2): Promise<Value | undefined> {
        const resultStr = await this.#redis.hGet(this.#toKey1(key1), this.#toKey2(key2));
        if (resultStr === undefined)
            return undefined;
        return await this.#serializer.read(resultStr);
    }

    public async getAll(key1: Key1): Promise<Map<Key2, Value>> {
        const result = await this.#redis.hGetAll(this.#toKey1(key1));
        return await this.#toMap(result);
    }

    public async set(key1: Key1, key2: Key2, value: Value): Promise<void> {
        const strKey1 = this.#toKey1(key1);
        await this.#redis.hSet(strKey1, this.#toKey2(key2), await this.#serializer.write(value));
        await this.#expire(strKey1);
    }

    public async setAll(key1: Key1, entries: Iterable<[key2: Key2, value: Value]>): Promise<void> {
        const strKey1 = this.#toKey1(key1);
        await this.#redis.hSet(strKey1, await this.#toRecord(entries));
        await this.#expire(strKey1);
    }

    public async delete(key1: Key1, key2: Key2): Promise<void> {
        await this.#redis.hDel(this.#toKey1(key1), this.#toKey2(key2));
    }

    public async deleteAll(key1: Key1): Promise<void> {
        await this.#redis.del(this.#toKey1(key1));
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

    async #toRecord(items: Iterable<[Key2, Value]>): Promise<Record<string, string>> {
        return Object.fromEntries(await this.#toEntries(items));
    }

    async #toEntries(items: Iterable<[Key2, Value]>): Promise<Iterable<[string, string]>> {
        return await Promise.all(
            Array.from(items)
                .map(async ([key, value]) => [key, await this.#serializer.write(value)] as [string, string])
        );
    }

    async #toMap(items: Record<string, string>): Promise<Map<Key2, Value>> {
        return new Map(
            await Promise.all(
                Object.entries(items)
                    .map(async e => [this.#fromKey2(e[0]), await this.#serializer.read(e[1])] as const)
            )
        );
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
