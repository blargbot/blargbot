export function quickMock<T extends object>(factory: () => T, props: Partial<T>): T {
    const target = factory();
    return new Proxy(target, {
        get(target, p) {
            return p in props
                ? props[p as keyof T]
                : target[p as keyof T];
        }
    });
}
