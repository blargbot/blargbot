export class Lazy<T> {
    #value?: T;
    readonly #factory: () => T;
    public get value(): T {
        return this.#value ??= this.#factory();
    }

    public constructor(factory: () => T) {
        this.#factory = factory;
    }
}
