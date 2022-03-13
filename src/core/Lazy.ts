export class Lazy<T> {
    #value?: T;
    public get value(): T { return this.#value ??= this.factory(); }

    public constructor(private readonly factory: () => T) {
    }
}
