export interface IKVCache<Key, Value> {
    get(key: Key): Awaitable<Value | undefined>;
    set(key: Key, value: Value): Awaitable<void>;
    setAll(values: Iterable<readonly [key: Key, value: Value]>): Awaitable<void>;
    delete(key: Key): Awaitable<void>;
    clear(): Awaitable<void>;
    size(): Awaitable<number>;
    lock(key: Key): Promise<() => Promise<void>>;
}
