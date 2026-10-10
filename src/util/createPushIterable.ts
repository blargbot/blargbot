export interface PushIterable<Yield, Return = void> {
    readonly next: (value: Yield) => void;
    readonly done: (value: Return) => void;
    readonly throw: (error: unknown) => void;
    readonly items: AsyncGenerator<Yield, void, Return>;
}

export function createPushIterable<T>(): PushIterable<T> {
    const enum STATE {
        RUNNING,
        COMPLETE,
        FAULTED
    }

    let queue: T[] = [];
    let pending: PromiseWithResolvers<void> | undefined;
    let state = STATE.RUNNING;
    let toThrow: unknown;

    async function* getIterator(): AsyncGenerator<T, void, void> {
        while (true) {
            yield* queue;
            queue = [];
            if (state !== STATE.RUNNING) {
                if (state === STATE.FAULTED)
                    throw toThrow;
                return;
            }
            pending ??= Promise.withResolvers();
            await pending.promise;
        }
    }

    return {
        items: getIterator(),
        next(value) {
            if (state !== STATE.RUNNING)
                return;

            queue.push(value);
            pending?.resolve();
            pending = undefined;
        },
        done() {
            if (state !== STATE.RUNNING)
                return;

            state = STATE.COMPLETE;
            pending?.resolve();
            pending = undefined;
        },
        throw(error) {
            if (state !== STATE.RUNNING)
                throw error;

            state = STATE.FAULTED;
            toThrow = error;
            pending?.resolve();
            pending = undefined;
        }
    };
}
