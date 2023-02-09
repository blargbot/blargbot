import type { RedisClientType } from 'redis';

export interface ICache<Key, Value> {
    get(key: Key): Awaitable<Value | undefined>;
    set(key: Key, value: Value): Awaitable<void>;
    getOrAdd(key: Key, factory: (key: Key) => Awaitable<Value>): Awaitable<Value>;
    delete(key: Key): Awaitable<void>;
}

export interface ISerializer<Value> {
    read(value: string): Value;
    write(value: Value): string;
}

export class RedisCache<Key, Value> implements ICache<Key, Value> {
    readonly #redis: RedisClientType;
    readonly #ttlS: number;
    readonly #toKey: (key: Key) => string;
    readonly #serializer: ISerializer<Value>;

    public constructor(redis: RedisClientType, options: RedisCacheOptions<Key, Value>) {
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

export interface RedisCacheOptions<Key, Value> {
    readonly ttlS: number;
    readonly keyFactory: (key: Key) => string;
    readonly serializer?: ISerializer<Value>;
}
