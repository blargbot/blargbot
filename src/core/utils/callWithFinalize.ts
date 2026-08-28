export function callWithFinalize<T>(action: () => T, cleanup: () => void): T {
    let result;
    try {
        result = action();
    } finally {
        if (result instanceof Promise)
            result = result.finally(() => cleanup()) as T;
        else
            cleanup();
    }
    return result;
}
