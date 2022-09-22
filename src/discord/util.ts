export async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
    if (signal?.aborted === true)
        throw signal.reason;

    await new Promise<void>((res, rej) => {
        const abort = (): void => {
            rej(signal?.reason);
            clearTimeout(timeout);
        };
        const success = (): void => {
            res();
            signal?.removeEventListener('abort', abort);
        };
        const timeout = setTimeout(success, ms);
        signal?.addEventListener('abort', abort);
    });
}

export function mergeAbortSignals(...signals: AbortSignal[]): { signal: AbortSignal; dispose: () => void; } {
    const controller = new AbortController();
    const dispose = (): void => {
        for (const signal of signals)
            signal.removeEventListener('abort', abort);
    };
    const abort = (reason: unknown): void => {
        dispose();
        controller.abort(reason);
    };
    for (const signal of signals)
        signal.addEventListener('abort', abort);

    return {
        signal: controller.signal,
        dispose: dispose
    };
}

export async function promiseRaceAbortable<R>(...targets: Array<Promise<R> | AbortSignal>): Promise<R> {
    const disposes: Array<() => void> = [];
    try {
        return await Promise.race(targets.map<Promise<R>>(t => {
            if (!(t instanceof AbortSignal))
                return t;
            if (t.aborted)
                throw t.reason;
            return new Promise<never>((_, rej) => {
                const abort = (): void => rej(t.reason);
                disposes.push(() => t.removeEventListener('abort', abort));
                t.addEventListener('abort', abort);
            });
        }));
    } finally {
        for (const dispose of disposes)
            dispose();
    }
}

declare global {
    interface AbortController {
        abort(reason?: unknown): void;
    }
    interface AbortSignal {
        reason: unknown;
        addEventListener(event: 'abort', handler: (reason: { type: 'abort'; }) => void): AbortSignal;
        removeEventListener(event: 'abort', handler: (reason: { type: 'abort'; }) => void): AbortSignal;
    }
}

export interface Deferred<T> {
    get state(): 'pending' | 'resolved' | 'rejected';
    wait(abort?: AbortSignal): Promise<T>;
    resolve(value: T): void;
    reject(error: unknown): void;
}

export function createDeferred<T>(): Deferred<T> {
    let resolve: (value: T) => void;
    let reject: (error: unknown) => void;
    let state: 'pending' | 'resolved' | 'rejected' = 'pending';
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    }).then(v => {
        state = 'resolved';
        return v;
    }, err => {
        state = 'rejected';
        throw err;
    });

    return {
        get state() {
            return state;
        },
        async wait(abort) {
            if (abort !== undefined)
                return await promiseRaceAbortable(promise, abort);

            return await promise;
        },
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        resolve: resolve!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        reject: reject!
    };
}
