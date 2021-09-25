export class Lazy<T> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #value?: T;
    public get value(): T { return this.#value ??= this.factory(); }

    public constructor(private readonly factory: () => T) {
    }
}
