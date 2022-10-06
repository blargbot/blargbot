export function isClass<TModule>(value: unknown, type: ClassOf<TModule>): value is new (...args: unknown[]) => TModule {
    return typeof value === `function` && value.prototype instanceof type;
}
