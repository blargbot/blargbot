
export function toArray(value: unknown): readonly unknown[] {
    const arr = Array.isArray(value) ? value
        : typeof value === `object` && value !== null ? [...value as Iterable<unknown>]
            : undefined;
    if (arr === undefined)
        throw new Error(`Cannot map ${String(value)}`);
    return arr;
}
