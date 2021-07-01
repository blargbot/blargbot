export function randInt(min: number, max: number, upperInclusive = true): number {
    return Math.floor(Math.random() * (max - min + (upperInclusive ? 1 : 0))) + min;
}
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

function createWrapper<T>(set: T[] | Set<T> | Iterable<T>): { length: number, get(index: number): T } {
    if ('size' in set) {
        let values;
        return { length: set.size, get(index) { return (values ??= [...set])[index]; } };
    }
    const arr = 'length' in set ? set : [...set];
    return { length: arr.length, get(index) { return arr[index]; } };
}