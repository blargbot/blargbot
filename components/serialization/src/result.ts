export function failed(reason: string): { success: false; reason: string; } {
    return { success: false, reason };
}

export function success<T>(value: T): { success: true; value: T; } {
    return { success: true, value };
}
