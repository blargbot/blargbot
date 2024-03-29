export function hasValue<T>(value: T): value is Exclude<T, null | undefined> {
    return value !== undefined && value !== null;
}
