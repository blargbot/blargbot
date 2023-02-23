export interface IKKVCache<Key1, Key2, Value> {
    get(key1: Key1, key2: Key2): Awaitable<Value | undefined>;
    getAll(key1: Key1): Awaitable<Map<Key2, Value>>;
    set(key1: Key1, key2: Key2, value: Value): Awaitable<void>;
    setAll(key1: Key1, entries: Iterable<[key2: Key2, value: Value]>): Awaitable<void>;
    delete(key1: Key1, key2: Key2): Awaitable<void>;
    deleteAll(key1: Key1): Awaitable<void>;
    clear(): Awaitable<void>;
    size(key1: Key1): Awaitable<number>;
    lock(key1: Key1): Promise<() => Promise<void>>;
    lock(key1: Key1, key2: Key2): Promise<() => Promise<void>>;
}
