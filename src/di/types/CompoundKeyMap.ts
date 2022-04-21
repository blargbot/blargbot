export class CompoundKeyMap<Key, Value> {
    readonly #rootMap: RecursiveMap<Key, Value> = new Map();

    public get(key: Iterable<Key>): Value | undefined {
        let map = this.#rootMap;
        for (const k of key) {
            const next = map.get(k);
            if (next === undefined)
                return undefined;
            map = next;
        }
        return map.value;
    }

    public set(key: Iterable<Key>, value: Value): void {
        let map = this.#rootMap;
        for (const k of key) {
            let next = map.get(k);
            if (next === undefined)
                map.set(k, next = new Map());
            map = next;
        }
        map.value = value;
    }
}

interface RecursiveMap<Key, Value> extends Map<Key, RecursiveMap<Key, Value>> {
    value?: Value;
}
