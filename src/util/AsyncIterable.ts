export type AsyncIterableObject<Yield> = InstanceType<typeof AsyncIterable<Yield>>;
// eslint-disable-next-line @typescript-eslint/naming-convention
export const AsyncIterable = class AsyncIterable<Yield> implements globalThis.AsyncIterable<Yield, unknown, unknown> {
    readonly #source: globalThis.AsyncIterable<Yield, unknown, unknown>;

    public static from<Yield>(source: globalThis.AsyncIterable<Yield, unknown, unknown> | globalThis.Iterable<Yield, unknown, unknown> | (() => Awaitable<AsyncIterator<Yield, unknown, unknown> | Iterator<Yield, unknown, unknown>>)): AsyncIterable<Yield> {
        if (typeof source === 'function')
            return new AsyncIterable({
                async *[Symbol.asyncIterator]() {
                    const iter = await source();
                    try {
                        while (true) {
                            const next = await iter.next();
                            if (next.done === true) return;
                            yield next.value;
                        }
                    } catch (error) {
                        await iter.throw?.(error);
                        throw error;
                    } finally {
                        await iter.return?.();
                    }
                }
            });

        if (isIterableObject(source))
            return source;

        if (Symbol.iterator in source) {
            return new AsyncIterable({
                // eslint-disable-next-line @typescript-eslint/require-await
                async *[Symbol.asyncIterator]() {
                    yield* source;
                }
            });
        }

        return new AsyncIterable(source);
    }

    public constructor(source: globalThis.AsyncIterable<Yield, unknown, unknown>) {
        this.#source = source;
    }

    async #enumerate<Result>(
        transform: (iterator: AsyncIteratorObject<Yield>) => Awaitable<Result>
    ): Promise<Result> {
        const iter = this[Symbol.asyncIterator]();
        try {
            return await transform(iter);
        } catch (error) {
            await iter.throw(error);
            throw error;
        } finally {
            await iter.return(undefined);
        }
    }

    public transform<Yield2>(
        transform: (iterator: AsyncIteratorObject<Yield>) => AsyncIteratorObject<Yield2>
    ): AsyncIterable<Yield2> {
        type Self = this
        return new AsyncIterable({
            [Symbol.asyncIterator]: async function* (this: Self) {
                const iter = this[Symbol.asyncIterator]();
                try {
                    yield* transform(iter);
                } catch (error) {
                    await iter.throw(error);
                    throw error;
                } finally {
                    await iter.return(undefined);
                }
            }.bind(this)
        });
    }

    public map<Result>(mapping: (value: Yield, index: number) => Awaitable<Result>): AsyncIterable<Result> {
        return this.transform(async function* (items) {
            let i = 0;
            for await (const item of items) {
                yield await mapping(item, i++);
            }
        });
    }

    public flatMap<Result>(mapping: (value: Yield, index: number) => Awaitable<Iterable<Result> | globalThis.AsyncIterable<Result>>): AsyncIterable<Result> {
        return this.transform(async function* (items) {
            let i = 0;
            for await (const item of items) {
                yield* await mapping(item, i++);
            }
        });
    }

    public take(count: number): AsyncIterable<Yield> {
        return this.transform(async function* (items) {
            for (let i = 0; i < count; i++) {
                const next = await items.next();
                if (next.done === true) return;
                yield next.value;
            }
        });
    }

    public drop(count: number): AsyncIterable<Yield> {
        return this.transform(async function* (items) {
            for (let i = 0; i < count; i++) {
                const next = await items.next();
                if (next.done === true) return;
            }
            yield* items;
        });
    }

    public filter(filter: (value: Yield, index: number) => Awaitable<boolean>): AsyncIterable<Yield>
    public filter<Derived extends Yield>(filter: (value: Yield, index: number) => value is Derived): AsyncIterable<Derived>
    public filter(filter: (value: Yield, index: number) => Awaitable<boolean>): AsyncIterable<Yield> {
        return this.transform(async function* (items) {
            let i = 0;
            for await (const item of items)
                if (await filter(item, i++))
                    yield item;
        });
    }

    public reduce(callbackFn: (previous: Yield, current: Yield, index: number) => Awaitable<Yield>): Promise<Yield>;
    public reduce(callbackFn: (previous: Yield, current: Yield, index: number) => Awaitable<Yield>, initialValue: Yield): Promise<Yield>
    public reduce<Return>(callbackFn: (previous: Return, current: Yield, index: number) => Awaitable<Return>, initialValue: Return): Promise<Return>
    public reduce<R>(callbackFn: (previous: R, current: Yield, index: number) => Awaitable<R>, initialValue?: R): Promise<unknown> {
        return this.#enumerate(async items => {
            let i = 0;
            if (arguments.length < 2) {
                const next = await items.next();
                if (next.done === true)
                    throw new TypeError('Reduce of empty AsyncIterator with no initial value.');
                initialValue = next.value as never;
                i = 1;
            }

            for (; ; i++) {
                const next = await items.next();
                if (next.done === true) return initialValue;
                initialValue = await callbackFn(initialValue!, next.value, i);
            }
        });
    }

    public async every(filter: (value: Yield, index: number) => Awaitable<boolean>): Promise<boolean> {
        let i = 0;
        for await (const item of this) {
            if (!await filter(item, i++))
                return false;
        }
        return true;
    }

    public async some(filter: (value: Yield, index: number) => Awaitable<boolean>): Promise<boolean> {
        let i = 0;
        for await (const item of this) {
            if (await filter(item, i++))
                return true;
        }
        return false;
    }

    public find(filter: (value: Yield, index: number) => Awaitable<boolean>): Promise<Yield | undefined>
    public find<Derived extends Yield>(filter: (value: Yield, index: number) => value is Derived): Promise<Derived | undefined>
    public async find(filter: (value: Yield, index: number) => Awaitable<boolean>): Promise<Yield | undefined> {
        let i = 0;
        for await (const item of this) {
            if (await filter(item, i++))
                return item;
        }
        return undefined;
    }

    public first(filter?: (value: Yield, index: number) => Awaitable<boolean>): Promise<Yield | undefined>
    public first<Derived extends Yield>(filter: (value: Yield, index: number) => value is Derived): Promise<Derived | undefined>
    public async first(filter?: (value: Yield, index: number) => Awaitable<boolean>): Promise<Yield | undefined> {
        if (filter === undefined) {
            for await (const item of this)
                return item;
            return undefined;
        }
        let i = 0;
        for await (const item of this) {
            if (await filter(item, i++))
                return item;
        }
        return undefined;
    }

    public last(filter?: (value: Yield, index: number) => Awaitable<boolean>): Promise<Yield | undefined>
    public last<Derived extends Yield>(filter: (value: Yield, index: number) => value is Derived): Promise<Derived | undefined>
    public async last(filter?: (value: Yield, index: number) => Awaitable<boolean>): Promise<Yield | undefined> {
        let result: Yield | undefined;
        if (filter === undefined) {
            for await (const item of this)
                result = item;
        } else {
            let i = 0;
            for await (const item of this) {
                if (await filter(item, i++))
                    result = item;
            }
        }
        return result;
    }

    public async forEach(callback: (value: Yield, index: number) => Awaitable<void>): Promise<void> {
        let i = 0;
        for await (const item of this)
            await callback(item, i++);
    }

    public async toArray(): Promise<Yield[]> {
        const result = [];
        for await (const item of this)
            result.push(item);
        return result;
    }

    public async *[Symbol.asyncIterator](): AsyncGenerator<Yield> {
        yield* this.#source;
    }
};

function isIterableObject<Yield>(source: AsyncIterable<Yield> | Iterable<Yield>): source is AsyncIterableObject<Yield> {
    return source instanceof AsyncIterable;
}
