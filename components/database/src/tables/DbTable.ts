export interface DbTable<Key, Value> {
    get(key: Key): Awaitable<Value | undefined>;
    set(key: Key, value: Value | undefined, returnValue?: false): Awaitable<boolean>;
    set(key: Key, value: Value | undefined, returnValue: true): Awaitable<Value | undefined>;
    update(key: Key, value: Partial<Value>, returnValue?: false): Awaitable<boolean>;
    update(key: Key, value: Partial<Value>, returnValue: true): Awaitable<Value | undefined>;
    delete(key: Key, returnValue?: false): Awaitable<boolean>;
    delete(key: Key, returnValue: true): Awaitable<Value | undefined>;
    add(value: Value, returnValue?: false): Awaitable<boolean>;
    add(value: Value, returnValue: true): Awaitable<Value | undefined>;
}

export interface CachedDbTable<Key, Value> extends DbTable<Key, Value> {
    get(key: Key, skipCache?: boolean): Awaitable<Value | undefined>;
}
