export interface Throttled<Args extends readonly unknown[]> {
    (...args: Args): void;
    get isQueued(): boolean;
    cancel(): void;
}

export function throttle<const Args extends readonly unknown[]>(callback: (...args: Args) => void, timeoutMs: number): Throttled<Args> {
    let pending: undefined | ReturnType<typeof setTimeout>;
    let recentArgs: Args | undefined;

    return Object.defineProperties(
        (...args: Args): void => {
            recentArgs = args;
            pending ??= setTimeout(() => {
                pending = undefined;
                const args = recentArgs!;
                recentArgs = undefined;
                callback(...args);
            }, timeoutMs);
        },
        {
            cancel: {
                value: () => {
                    clearTimeout(pending);
                    pending = undefined;
                    recentArgs = undefined;
                }
            },
            isQueued: {
                get: () => pending !== undefined
            }
        }
    );
}
