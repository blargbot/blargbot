export function cacheResult<T>(factory: () => T): () => T {
    let executed = false;
    let result = undefined as T;
    return () => {
        if (executed)
            return result;
        executed = true;
        try {
            return result = factory();
        } catch (error) {
            executed = false;
            throw error;
        }
    };
}
