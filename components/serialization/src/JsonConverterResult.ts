export type JsonConverterResult<T> =
    | { success: true; value: T; }
    | { success: false; reason: string; };
