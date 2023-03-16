export class ContextManager<Args extends readonly unknown[] = [], State = void> {
    readonly #enter: (...args: Args) => State;
    readonly #exit: (state: State, ...args: Args) => void;

    public constructor(
        options: {
            enter: (...args: Args) => State;
            exit: (state: State, ...args: Args) => void;
        }) {
        this.#enter = options.enter;
        this.#exit = options.exit;
    }

    public invoke<T>(action: (state: State) => T, ...args: Args): T {
        const state = this.#enter(...args);

        let result: T;

        try {
            result = action(state);
        } catch (err) {
            this.#exit(state, ...args);
            throw err;
        }

        if (typeof result === 'object' && result !== null)
            return this.#wrapWellKnownResultTypes(result, state, args);

        this.#exit(state, ...args);
        return result;
    }

    #wrapWellKnownResultTypes<T extends object>(result: T, state: State, args: Args): T {
        if (result instanceof Promise)
            return result.finally(() => this.#exit(state, ...args)) as T;
        result = Object.create(result);
        if (Symbol.iterator in result)
            result[Symbol.iterator] = this.#createIterableWrapper(result, state, args);
        if (Symbol.asyncIterator in result)
            result[Symbol.asyncIterator] = this.#createAsyncIterableWrapper(result, state, args);

        return result;
    }

    #createIterableWrapper<T extends { [Symbol.iterator]: unknown; }>(iterable: T, state: State, args: Args): T[typeof Symbol.iterator];
    #createIterableWrapper<T extends { [Symbol.iterator](): Iterator<Y, R, N>; }, Y, R, N>(iterable: T, state: State, args: Args): () => Iterator<Y, R, N> {
        return function* (this: ContextManager<Args, State>) {
            try {
                return yield* iterable;
            } finally {
                this.#exit(state, ...args);
            }
        }.bind(this);
    }
    #createAsyncIterableWrapper<T extends { [Symbol.asyncIterator]: unknown; }>(iterable: T, state: State, args: Args): T[typeof Symbol.asyncIterator];
    #createAsyncIterableWrapper<T extends { [Symbol.asyncIterator](): AsyncIterator<Y, R, N>; }, Y, R, N>(iterable: T, state: State, args: Args): () => AsyncIterator<Y, R, N> {
        return async function* (this: ContextManager<Args, State>) {
            try {
                return yield* iterable;
            } finally {
                this.#exit(state, ...args);
            }
        }.bind(this);
    }
}
