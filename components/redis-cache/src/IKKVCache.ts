export interface IKKVCache<Key1, Key2, Value> {
    get(key1: Key1, key2: Key2): Awaitable<Value | undefined>;
    getAll(key1: Key1): Awaitable<Map<Key2, Value>>;
    set(key1: Key1, key2: Key2, value: Value): Awaitable<void>;
    setAll(key1: Key1, entries: Iterable<[key2: Key2, value: Value]>): Awaitable<void>;
    getOrAdd(key1: Key1, key2: Key2, factory: (key1: Key1, key2: Key2) => Awaitable<Value>): Awaitable<Value>;
    getOrAddAll(key1: Key1, keys: Iterable<Key2>, factory: (key1: Key1, key2: Key2) => Awaitable<Value>): Awaitable<Map<Key2, Value>>;
    getOrAddAll(key1: Key1, entries: Iterable<[key2: Key2, value: (key1: Key1, key2: Key2) => Awaitable<Value>]>): Awaitable<Map<Key2, Value>>;
    delete(key1: Key1, key2: Key2): Awaitable<void>;
    deleteAll(key1: Key1): Awaitable<void>;
    clear(): Awaitable<void>;
    size(key1: Key1): Awaitable<number>;
    upsert(key1: Key1, key2: Key2, update: Value, merge: (update: Value, current: Value) => Value): Awaitable<Value>;
    upsertAll(key1: Key1, getUpdates: (current: Map<Key2, Value>) => Iterable<[Key2, Value]>): Awaitable<Map<Key2, Value>>;
}
