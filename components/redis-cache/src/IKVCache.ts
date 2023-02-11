export interface IKVCache<Key, Value> {
    get(key: Key): Awaitable<Value | undefined>;
    set(key: Key, value: Value): Awaitable<void>;
    getOrAdd(key: Key, factory: (key: Key) => Awaitable<Value>): Awaitable<Value>;
    delete(key: Key): Awaitable<void>;
}
