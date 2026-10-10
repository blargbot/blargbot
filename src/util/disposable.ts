export const disposable = {
    empty: {
        [Symbol.dispose]() { }
    },
    create<const Args extends readonly unknown[]>(disposeFn: (...args: Args) => void, ...args: Args): Disposable {
        let disposed = false;
        return {
            [Symbol.dispose]() {
                if (disposed)
                    return;
                disposed = true;
                disposeFn(...args);
            }
        };
    },
    withState<State, const Args extends readonly unknown[]>(
        enter: (...args: Args) => State,
        exit: (state: State, ...args: Args) => void,
        ...args: Args
    ): Disposable {
        const state = enter(...args);
        return disposable.create(exit.bind(null, state), ...args);
    },
    withCallback<const Args extends readonly unknown[]>(
        enter: (...args: Args) => () => void,
        ...args: Args
    ): Disposable {
        const dispose = enter(...args);
        return disposable.create(dispose);
    }
};
