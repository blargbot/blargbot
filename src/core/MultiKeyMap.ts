import { EventEmitter } from 'eventemitter3';

interface MultiKeyMapEvents<TKey, TValue> {
    remove: [value: TValue];
    add: [value: TValue];
    unlink: [value: TValue, key: TKey];
    link: [value: TValue, key: TKey];
}

export class MultiKeyMap<TKey, TValue> extends EventEmitter<MultiKeyMapEvents<TKey, TValue>> {
    readonly #kv: Map<TKey, TValue>;
    readonly #vk: Map<TValue, Set<TKey>>;

    public get size(): number { return this.#vk.size; }

    public *[Symbol.iterator](): IterableIterator<[TKey, TValue]> {
        yield* this.#kv;
    }

    public constructor() {
        super();
        this.#kv = new Map();
        this.#vk = new Map();
    }

    public clear(): void {
        const links = [...this.entries()];
        const values = [...this.values()];

        this.#kv.clear();
        this.#vk.clear();

        for (const [key, value] of links)
            this.emit(`unlink`, value, key);

        for (const value of values)
            this.emit(`remove`, value);
    }

    public get(key: TKey): TValue | undefined {
        return this.#kv.get(key);
    }

    public has(key: TKey): boolean {
        return this.#kv.has(key);
    }

    public keys(): IterableIterator<TKey> {
        return this.#kv.keys();
    }

    public values(): IterableIterator<TValue> {
        return this.#vk.keys();
    }

    public set(key: TKey, value: TValue): void {
        const existing = this.#kv.get(key);
        if (existing !== undefined)
            this.delete(key);

        const adding = !this.#vk.has(value);
        let keys = this.#vk.get(value);
        if (keys === undefined)
            this.#vk.set(value, keys = new Set());
        this.#kv.set(key, value);

        if (adding)
            this.emit(`add`, value);
        this.emit(`link`, value, key);

        keys.add(key);
    }

    public delete(key: TKey): boolean {
        const value = this.#kv.get(key);
        if (value === undefined)
            return false;

        const keys = this.#vk.get(value);
        if (keys !== undefined) {
            keys.delete(key);
            if (keys.size === 0)
                this.#vk.delete(value);
        }
        this.#kv.delete(key);

        this.emit(`unlink`, value, key);
        if (keys?.size === 0)
            this.emit(`remove`, value);

        return true;
    }

    public entries(): IterableIterator<[TKey, TValue]> {
        return this.#kv.entries();
    }

    public forEach(callback: (this: undefined, key: TKey, value: TValue, map: this) => void): void;
    public forEach<TThis>(callback: (this: TThis, key: TKey, value: TValue, map: this) => void, thisArg: TThis): void;
    public forEach(callback: (this: undefined, key: TKey, value: TValue, map: this) => void, thisArg?: undefined): void {
        this.#kv.forEach((value, key) => callback.call(thisArg, key, value, this));
    }
}
