export function notUndefined<T>(value: T): value is Exclude<T, undefined> {
    return value !== undefined;
}
