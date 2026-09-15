export type JsonResult<T> = { success: true; value: T; } | { success: false; error: unknown; }

export const safeJSON = {
    parse(value: string): JsonResult<JToken> {
        try {
            return { success: true, value: JSON.parse(value) };
        } catch (error) {
            return { success: false, error };
        }
    },
    stringify(value: unknown): JsonResult<string> {
        try {
            return { success: true, value: JSON.stringify(value) };
        } catch (error) {
            return { success: false, error };
        }
    }
};
