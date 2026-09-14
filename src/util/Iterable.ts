export type IterableObject<Yield> = InstanceType<typeof Iterable<Yield>>;
// eslint-disable-next-line @typescript-eslint/naming-convention
export const Iterable = class Iterable<Yield> implements globalThis.Iterable<Yield, unknown, unknown> {
    readonly #source: globalThis.Iterable<Yield, unknown, unknown>;

    public static range(count: number): Iterable<number>;
    public static range(start: number, count: number, step?: number): Iterable<number>;
    public static range(start: number, count?: number, step = 1): Iterable<number> {
        if (count === undefined) {
            count = start;
            start = 0;
        }

        return Iterable.from(function* range() {
            for (let i = 0; i < count; i++) {
                yield start;
                start += step;
            }
        });

    }

    public static forever<T>(value: T): Iterable<T> {
        return Iterable.from(function* forever() {
            while (true)
                yield value;
        });
    }

    public static from<Yield>(source: globalThis.Iterable<Yield, unknown, unknown> | (() => Iterator<Yield, unknown, unknown>)): Iterable<Yield> {
        if (typeof source === 'function')
            return new Iterable({ [Symbol.iterator]: source });

        if (isIterableObject(source))
            return source;

        return new Iterable(source);
    }

    public constructor(source: globalThis.Iterable<Yield, unknown, unknown>) {
        this.#source = source;
    }

    public transform<Yield2>(
        transform: (iterator: IteratorObject<Yield>) => IteratorObject<Yield2>
    ): Iterable<Yield2> {
        return new Iterable({
            [Symbol.iterator]: () => transform(this[Symbol.iterator]())
        });
    }

    public map<Result>(mapping: (value: Yield, index: number) => Result): Iterable<Result> {
        return this.transform(x => x.map(mapping));
    }

    public flatMap<Result>(mapping: (value: Yield, index: number) => Iterable<Result>): Iterable<Result> {
        return this.transform(x => x.flatMap(mapping));
    }

    public take(count: number): Iterable<Yield> {
        return this.transform(x => x.take(count));
    }

    public drop(count: number): Iterable<Yield> {
        return this.transform(x => x.drop(count));
    }

    public filter(filter: (value: Yield, index: number) => boolean): Iterable<Yield>
    public filter<Derived extends Yield>(filter: (value: Yield, index: number) => value is Derived): Iterable<Derived>
    public filter(filter: (value: Yield, index: number) => boolean): Iterable<Yield> {
        return this.transform(x => x.filter(filter));
    }

    public reduce(callbackFn: (previous: Yield, current: Yield, index: number) => Yield): Yield;
    public reduce(callbackFn: (previous: Yield, current: Yield, index: number) => Yield, initialValue: Yield): Yield
    public reduce<Return>(callbackFn: (previous: Return, current: Yield, index: number) => Return, initialValue: Return): Return
    public reduce<R>(callbackFn: (previous: R, current: Yield, index: number) => R, initialValue?: R): unknown {
        return this[Symbol.iterator]().reduce(callbackFn, initialValue!);
    }

    public every(filter: (value: Yield, index: number) => boolean): boolean {
        return this[Symbol.iterator]().every(filter);
    }

    public some(filter: (value: Yield, index: number) => boolean): boolean {
        return this[Symbol.iterator]().some(filter);
    }

    public find(filter: (value: Yield, index: number) => boolean): Yield | undefined
    public find<Derived extends Yield>(filter: (value: Yield, index: number) => value is Derived): Derived | undefined
    public find(filter: (value: Yield, index: number) => boolean): Yield | undefined {
        return this[Symbol.iterator]().find(filter);
    }

    public first(filter?: (value: Yield, index: number) => boolean): Yield | undefined
    public first<Derived extends Yield>(filter: (value: Yield, index: number) => value is Derived): Derived | undefined
    public first(filter?: (value: Yield, index: number) => boolean): Yield | undefined {
        return this[Symbol.iterator]().find(filter ?? (() => true));
    }

    public last(filter?: (value: Yield, index: number) => boolean): Yield | undefined
    public last<Derived extends Yield>(filter: (value: Yield, index: number) => value is Derived): Derived | undefined
    public last(filter?: (value: Yield, index: number) => boolean): Yield | undefined {
        filter ??= () => true;
        return this[Symbol.iterator]().reduce((p, c, i) => {
            if (filter(c, i))
                return c;
            return p;
        }, undefined as Yield | undefined);
    }

    public forEach(callback: (value: Yield, index: number) => void): void {
        this[Symbol.iterator]().forEach(callback);
    }

    public toArray(): Yield[] {
        return this[Symbol.iterator]().toArray();
    }

    public [Symbol.iterator](): IteratorObject<Yield> {
        return Iterator.from(this.#source[Symbol.iterator]());
    }
};

function isIterableObject<Yield>(source: Iterable<Yield>): source is IterableObject<Yield> {
    return source instanceof Iterable;
}
