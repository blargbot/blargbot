export function isBetween<T extends { valueOf(): number; }>(value: T, lower: T, upper: T, inclusive: boolean): boolean
export function isBetween<T extends { valueOf(): bigint; }>(value: T, lower: T, upper: T, inclusive: boolean): boolean
export function isBetween<T extends { valueOf(): string; }>(value: T, lower: T, upper: T, inclusive: boolean): boolean
export function isBetween<T extends { valueOf(): number | bigint | string; }>(value: T, lower: T, upper: T, inclusive: boolean): boolean {
    if (lower > upper)
        [lower, upper] = [upper, lower];

    if (inclusive)
        return value >= lower && value <= upper;
    return value > lower && value < upper;
}
