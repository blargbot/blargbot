export async function* callbackToAsyncIterable<Yield, Return = void>(bind: (emit: (value: Yield) => void, reject: (error: unknown) => void, finish: (value: Return) => void) => Awaitable<void | (() => Awaitable<void>)>): AsyncGenerator<Yield, Return, void> {
    const pending: Array<Emitted<Yield, Return>> = [];
    let done = false;
    let resolveWaiter: undefined | (() => void);
    let currentWaiter: undefined | Promise<void>;
    function emit<T extends Emitted<Yield, Return>>(type: T['type'], value: T['value']): void {
        if (done)
            return;
        if (type !== EmitType.YIELD)
            done = true;

        pending.push({ type, value } as Emitted<Yield, Return>);
        const res = resolveWaiter;
        currentWaiter = undefined;
        res?.();
    }
    const waitForEvent = (): Promise<void> => currentWaiter ??= new Promise<void>(res => resolveWaiter = res);
    const disconnect = await bind(
        emit.bind(null, EmitType.YIELD),
        emit.bind(null, EmitType.RETURN),
        emit.bind(null, EmitType.THROW)
    );
    try {
        while (true) {
            await waitForEvent();
            let element;
            while ((element = pending.shift()) !== undefined) {
                switch (element.type) {
                    case EmitType.YIELD:
                        yield element.value;
                        break;
                    case EmitType.RETURN:
                        return element.value;
                    case EmitType.THROW:
                        throw element.value;
                }
            }
        }
    } finally {
        await disconnect?.();
    }
}

type Emitted<Yield, Return> =
    | { type: EmitType.YIELD; value: Yield; }
    | { type: EmitType.RETURN; value: Return; }
    | { type: EmitType.THROW; value: unknown; }

const enum EmitType {
    YIELD,
    RETURN,
    THROW
}
