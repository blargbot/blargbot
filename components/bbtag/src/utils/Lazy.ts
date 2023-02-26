export class Lazy<T> {
    readonly #factory: () => T;
    public get value(): T {
        const value = this.#factory();
        Object.defineProperty(this, 'value', { value });
        return value;
    }

    public constructor(factory: () => T) {
        this.#factory = factory;
    }
}
