export function between(
    value: number,
    lower: number,
    upper: number,
    inclusive: boolean
): boolean {
    if (lower > upper) [lower, upper] = [upper, lower];

    if (inclusive) return value >= lower && value <= upper;
    return value > lower && value < upper;
}
