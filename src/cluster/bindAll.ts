export function bindAll<T extends object>(target: { prototype: T; }) {
    for (const prop of Reflect.ownKeys(target.prototype)) {
        const descriptor = Reflect.getOwnPropertyDescriptor(target.prototype, prop);
        if (descriptor === undefined)
            continue;
        if (descriptor.configurable === false)
            continue;

        if (typeof descriptor.value === 'function') {
            const fn = descriptor.value;
            Reflect.defineProperty(target.prototype, prop, {
                get() {
                    const bound = fn.bind(this);
                    Reflect.defineProperty(this, prop, { value: bound, enumerable: descriptor.enumerable, configurable: true, writable: true });
                    return bound;
                },
                set(value) {
                    Reflect.defineProperty(this, prop, { value, enumerable: true, configurable: true, writable: true });
                }
            });
        }
    }
}
