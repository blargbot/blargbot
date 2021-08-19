import { randInt } from './randInt';

export function randChoose<T>(set: T[] | Set<T> | Iterable<unknown>): T
export function randChoose<K, V>(set: Map<K, V>): [K, V];
export function randChoose<T>(set: T[] | Set<T> | Iterable<unknown>, count: number): T[]
export function randChoose<K, V>(set: Map<K, V>, count: number): Array<[K, V]>;
export function randChoose(set: unknown[] | Set<unknown> | Map<unknown, unknown> | Iterable<unknown>, count?: number): unknown | unknown[] {
    const wrapper = createWrapper(set);
    if (count === undefined)
        return wrapper.get(randInt(0, wrapper.length, false));

    const result = [];
    for (let i = 0; i < count; i++)
        result.push(wrapper.get(randInt(0, wrapper.length, false)));
    return result;
}

function createWrapper(set: unknown[] | Set<unknown> | Iterable<unknown> | string): { length: number; get(index: number): unknown; } {
    if (typeof set === 'string') {
        return {
            length: set.length,
            get(index) { return set[index]; }
        };
    }
    if ('size' in set) {
        let values: undefined | unknown[];
        return {
            length: set.size,
            get: (index) => (values ??= [...set])[index]
        };
    }
    const arr = 'length' in set ? set : [...set];
    return {
        length: arr.length,
        get: (index) => arr[index]
    };
}
