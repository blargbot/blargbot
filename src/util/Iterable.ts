export class Iterable<Yeild> implements globalThis.Iterable<Yeild, unknown, unknown> {
    readonly #source: globalThis.Iterable<Yeild, unknown, unknown>;

    public static from<Yeild>(source: globalThis.Iterable<Yeild, unknown, unknown>): Iterable<Yeild> {
        if (isIterableObject(source))
            return source;

        return new Iterable(source);
    }

    public constructor(source: globalThis.Iterable<Yeild, unknown, unknown>) {
        this.#source = source;
    }

    public transform<Yeild2>(
        transform: (iterator: IteratorObject<Yeild>) => IteratorObject<Yeild2>
    ): Iterable<Yeild2> {
        return new Iterable({
            [Symbol.iterator]: () => transform(this[Symbol.iterator]())
        });
    }

    public [Symbol.iterator](): IteratorObject<Yeild> {
        return Iterator.from(this.#source[Symbol.iterator]());
    }
}

function isIterableObject<Yeild>(source: globalThis.Iterable<Yeild>): source is Iterable<Yeild> {
    return source instanceof Iterable;
}
