type ElementType<T> = T extends Iterable<infer E> ? E : unknown;
type ToArrayResult<T> = ReadonlyArray<ElementType<T>>;
export function toArray<T>(value: T): ToArrayResult<T> {
    if (Array.isArray(value))
        return value as ToArrayResult<T>;
    if (typeof value === 'object' && value !== null && Symbol.iterator in value)
        return [...value as Iterable<ElementType<T>>];

    throw new Error(`Cannot map ${String(value)}`);
}
