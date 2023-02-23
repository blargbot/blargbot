export interface IKSCache<Key, Value> {
    list(key: Key): Awaitable<Value[]>;
    add(key: Key, value: Value): Awaitable<void>;
    addAll(key: Key, values: Iterable<Value>): Awaitable<void>;
    remove(key: Key, value: Value): Awaitable<void>;
    removeAll(key: Key, values: Iterable<Value>): Awaitable<void>;
    has(key: Key, value: Value): Awaitable<boolean>;
    hasAll(key: Key, values: Iterable<Value>): Awaitable<boolean>;
    hasAny(key: Key, values: Iterable<Value>): Awaitable<boolean>;
    clear(key?: Key): Awaitable<void>;
    size(key?: Key): Awaitable<number>;
    lock(key: Key): Promise<() => Promise<void>>;
}
