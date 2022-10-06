import { BinderResult, Binding, BindingResultAsyncIterator, BindingResultIterator, BindingResultValue } from '@blargbot/core/types';

export class Binder<TState> {
    public static readonly binder = Symbol(`binder`);
    readonly #bindings: ReadonlyArray<Binding<TState>>;
    readonly #selector: (current: TState, next: TState) => TState;

    public constructor(
        bindings: ReadonlyArray<Binding<TState>>,
        selector: (current: TState, next: TState) => TState
    ) {
        this.#bindings = bindings;
        this.#selector = selector;
    }

    public debugView(): string {
        return this.#bindings.flatMap(b => [...b.debugView()]).join(`\n`);
    }

    public async bind(state: TState): Promise<BinderResult<TState>> {
        return await bind(state, this.#bindings, this.#selector);
    }
}

interface AsyncEnumerator<TResult> {
    moveNext(): Promise<boolean>;
    get current(): TResult;
}

async function bind<TState>(state: TState, bindings: Iterable<Binding<TState>>, selector: (current: TState, next: TState) => TState): Promise<BinderResult<TState>> {
    let bestState = state;
    forLoop:
    for (const binding of bindings) {
        const iterator = getEnumerator(state, binding);
        while (await iterator.moveNext()) {
            if (!iterator.current.success) {
                bestState = selector(bestState, iterator.current.state);
                continue;
            }

            if (iterator.current.next.length === 0)
                return { success: true, state: iterator.current.state };

            const result = await bind(iterator.current.state, iterator.current.next, selector);
            if (result.success)
                return result;

            bestState = selector(bestState, result.state);

            if (!iterator.current.checkNext)
                break forLoop;
        }
    }

    return { success: false, state: bestState };
}

function getEnumerator<TState>(state: TState, binding: Binding<TState>): AsyncEnumerator<BindingResultValue<TState>> {
    const result = binding[Binder.binder](state);
    if (`success` in result)
        return toEnumerator({ *[Symbol.iterator]() { yield result; } }[Symbol.iterator]());
    if (`then` in result)
        return toEnumerator({ async *[Symbol.asyncIterator]() { yield await result; } }[Symbol.asyncIterator]());
    if (`next` in result)
        return toEnumerator(result);

    const _: never = result;
    return _;
}

function toEnumerator<TState>(iterator: BindingResultIterator<TState> | BindingResultAsyncIterator<TState>): AsyncEnumerator<BindingResultValue<TState>> {
    let getCurrent: () => BindingResultValue<TState> = throwDelegate(() => new Error(`moveNext must be called first`));
    let moveNext: () => Promise<boolean> = async () => {
        const next = await iterator.next();
        if (next.done === true) {
            getCurrent = throwDelegate(() => new Error(`Enumerator has been exhausted`));
            moveNext = () => Promise.resolve(false);
            return false;
        }

        getCurrent = () => next.value;
        return true;

    };

    return {
        get current(): BindingResultValue<TState> { return getCurrent(); },
        moveNext() { return moveNext(); }
    };
}

function throwDelegate(error: () => Error): () => never {
    return () => {
        throw error();
    };
}
