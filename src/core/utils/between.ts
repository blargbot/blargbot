export function between<T extends { valueOf(): number | bigint | string; }>(value: T, lower: T, upper: T, inclusive: boolean): boolean {
    if (lower > upper)
        [lower, upper] = [upper, lower];

    if (inclusive)
        return value >= lower && value <= upper;
    return value > lower && value < upper;
}
