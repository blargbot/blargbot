import { EventEmitter } from 'eventemitter3';

export class MultiKeyMap<TKey, TValue> extends EventEmitter {
    kv: Map<TKey, TValue>;
    vk: Map<TValue, Set<TKey>>;

    get size() { return this.kv.size; }

    *[Symbol.iterator]() {
        yield* this.kv;
    }

    constructor() {
        super();
        this.kv = new Map();
        this.vk = new Map();
    }

    clear() {
        let links = [...this.entries()];
        let values = [...this.values()];

        this.kv.clear();
        this.vk.clear();

        for (let [key, value] of links)
            this.emit('unlink', value, key);

        for (let value of values)
            this.emit('remove', value);
    }

    get(key: TKey) {
        return this.kv.get(key);
    }

    has(key: TKey) {
        return this.kv.has(key);
    }

    keys() {
        return this.kv.keys();
    }

    values() {
        return this.vk.keys();
    }

    set(key: TKey, value: TValue) {
        let existing = this.kv.get(key);
        if (existing !== undefined)
            this.delete(key);

        let adding = !this.vk.has(value);
        let keys = this.vk.get(value);
        if (keys === undefined)
            this.vk.set(value, keys = new Set());
        this.kv.set(key, value);

        if (adding)
            this.emit('add', value);
        this.emit('link', value, key);

        keys.add(key);
    }

    delete(key: TKey) {
        let value = this.kv.get(key);
        if (value === undefined)
            return false;

        let keys = this.vk.get(value);
        if (keys) {
            keys.delete(key);
            if (keys.size === 0)
                this.vk.delete(value);
        }
        this.kv.delete(key);

        this.emit('unlink', value, key);
        if (keys?.size === 0)
            this.emit('remove', value);

        return true;
    }

    entries() {
        return this.kv.entries();
    }

    forEach(callback: (this: undefined, key: TKey, value: TValue, map: this) => void): void;
    forEach<TThis>(callback: (this: TThis, key: TKey, value: TValue, map: this) => void, thisArg: TThis): void;
    forEach(callback: (this: any, key: TKey, value: TValue, map: this) => void, thisArg?: any) {
        this.kv.forEach((value, key, _) => callback.call(thisArg, key, value, this));
    }
}