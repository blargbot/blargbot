export class MappedIterable<Source, Result> implements Iterable<Result> {
    readonly #source: Iterable<Source>;
    readonly #mapping: (value: Source) => Result;

    public constructor(source: Iterable<Source>, mapping: (value: Source) => Result) {
        this.#source = source;
        this.#mapping = mapping;
    }

    public *[Symbol.iterator](): Iterator<Result, void, never> {
        for (const elem of this.#source)
            yield this.#mapping(elem);
    }
}
