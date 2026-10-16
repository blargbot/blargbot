export interface PushIterable<Yield, Return = void> {
    readonly next: (value: Yield) => void;
    readonly return: (value: Return) => void;
    readonly throw: (error: unknown) => void;
    readonly items: AsyncGenerator<Yield, Return, void>;
}

export function createPushIterable<Yield, Return = void>(): PushIterable<Yield, Return> {
    const enum STATE {
        RUNNING,
        COMPLETE,
        FAULTED,
        BREAK
    }

    const queue: Yield[] = [];
    let pending: PromiseWithResolvers<void> | undefined;
    let state = STATE.RUNNING;
    let toThrow: unknown;
    let result: undefined | Return;

    async function* getIterator(): AsyncGenerator<Yield, Return, void> {
        try {
            while (true) {
                const batch = [...queue];
                queue.length = 0;
                yield* batch;
                if (state !== STATE.RUNNING) {
                    if (state === STATE.FAULTED)
                        throw toThrow;
                    return result!;
                }
                pending ??= Promise.withResolvers();
                await pending.promise;
            }
        } finally {
            if (state === STATE.RUNNING)
                state = STATE.BREAK;
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
        return(value) {
            if (state !== STATE.RUNNING)
                return;

            state = STATE.COMPLETE;
            result = value;
            pending?.resolve();
            pending = undefined;
        },
        throw(error) {
            if (state !== STATE.RUNNING)
                return;

            state = STATE.FAULTED;
            toThrow = error;
            pending?.resolve();
            pending = undefined;
        }
    };
}
