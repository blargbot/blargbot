export function deepClone<T>(value: T, seen?: WeakMap<object, unknown>): T;
export function deepClone(value: unknown, seen = new WeakMap<object, unknown>()): unknown {
    if (value === null || typeof value !== 'object') {
        return value;
    }

    if (typeof value === 'function') {
        return value;
    }

    if (seen.has(value)) {
        return seen.get(value);
    }

    if (value instanceof Date) {
        return new Date(value);
    }

    if (value instanceof RegExp) {
        return new RegExp(value.source, value.flags);
    }

    if (value instanceof Map) {
        const result = new Map();
        seen.set(value, result);

        for (const [key, val] of value) {
            result.set(deepClone(key, seen), deepClone(val, seen));
        }

        return result;
    }

    if (value instanceof Set) {
        const result = new Set();
        seen.set(value, result);

        for (const val of value) {
            result.add(deepClone(val, seen));
        }

        return result;
    }

    if (ArrayBuffer.isView(value)) {
        return new (value.constructor as new (v: typeof value) => unknown)(value);
    }

    if (value instanceof ArrayBuffer || value instanceof SharedArrayBuffer) {
        return value.slice(0);
    }

    const result = Array.isArray(value)
        ? []
        : Object.create(Object.getPrototypeOf(value)) as object;

    seen.set(value, result);

    for (const key of Reflect.ownKeys(value)) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key)!;

        if ('value' in descriptor) {
            descriptor.value = deepClone(descriptor.value as unknown, seen);
        }

        Object.defineProperty(result, key, descriptor);
    }

    return result;
}
