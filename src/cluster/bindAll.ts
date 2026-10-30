export function bindAll<T extends object>(target: { prototype: T; }): void {
    for (const prop of Reflect.ownKeys(target.prototype)) {
        const descriptor = Reflect.getOwnPropertyDescriptor(target.prototype, prop);
        if (descriptor === undefined)
            continue;
        if (descriptor.configurable === false)
            continue;

        if (typeof descriptor.value === 'function') {
            const fn = descriptor.value as (this: T, ...args: never) => unknown;
            Reflect.defineProperty(target.prototype, prop, {
                get(this: T) {
                    const bound = fn.bind(this);
                    Reflect.defineProperty(this, prop, { value: bound, enumerable: descriptor.enumerable, configurable: true, writable: true });
                    return bound;
                },
                set(this: T, value) {
                    Reflect.defineProperty(this, prop, { value, enumerable: true, configurable: true, writable: true });
                }
            });
        }
    }
}
