export class CachedIterable<T> implements Iterable<T> {
    #source?: Iterable<T>;
    readonly #results: T[];
    #iter?: Iterator<T, void, never>;

    public constructor(source: Iterable<T>) {
        this.#source = source;
        this.#results = [];
    }

    public *[Symbol.iterator](): Iterator<T, void, never> {
        if (this.#source === undefined) {
            yield* this.#results;
            return;
        }

        this.#iter ??= this.#source[Symbol.iterator]();
        let i = 0;
        while (true) {
            for (; i < this.#results.length; i++)
                yield this.#results[i];
            const next = this.#iter.next();
            if (next.done === true)
                break;
            this.#results.push(next.value);
        }

        this.#iter = undefined;
        this.#source = undefined;
    }
}
