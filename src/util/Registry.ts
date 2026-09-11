
export class Registry<T> implements Iterable<T> {
    readonly #items: Array<{ value: T; }> = [];

    public get isEmpty(): boolean {
        return this.#items.length === 0;
    }

    public register(value: T): Disposable {
        const ref = { value };
        this.#items.push(ref);
        return {
            [Symbol.dispose]: () => {
                const index = this.#items.indexOf(ref);
                if (index >= 0)
                    this.#items.splice(index);
            }
        };
    }

    public *[Symbol.iterator](): Generator<T, void, void> {
        for (const { value } of [...this.#items])
            yield value;
    }
}
