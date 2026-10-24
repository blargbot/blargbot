export function memoize<Result>(impl: () => Result): () => Result {
    let done: undefined | { success: true; value: Result; } | { success: false; error: unknown; };
    return function () {
        if (done !== undefined) {
            if (done.success)
                return done.value;
            throw done.error;
        }
        try {
            done = { success: true, value: impl() };
            return done.value;
        } catch (error) {
            done = { success: false, error: error };
            throw error;
        }
    };
}
