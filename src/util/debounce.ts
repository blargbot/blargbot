export interface Debounced<Args extends readonly unknown[]> {
    (...args: Args): void;
    get isQueued(): boolean;
    cancel(): void;
}

export function debounce<const Args extends readonly unknown[] = []>(callback: (...args: Args) => void, timeoutMs: number, maxTimeoutMs: number = Infinity): Debounced<Args> {
    let debounceStartTime: number | undefined;
    let pending: ReturnType<typeof setTimeout> | undefined;
    return Object.defineProperties(
        (...args: Args) => {
            const now = performance.now();
            debounceStartTime ??= now;
            const runAt = Math.min(now + timeoutMs, debounceStartTime + maxTimeoutMs);
            clearTimeout(pending);
            pending = setTimeout(() => {
                pending = undefined;
                debounceStartTime = undefined;
                callback(...args);
            }, Math.max(0, runAt - now));
        },
        {
            cancel: {
                value: () => {
                    clearTimeout(pending);
                    pending = undefined;
                    debounceStartTime = undefined;
                }
            },
            isQueued: {
                get: () => pending !== undefined
            }
        }
    );
}
