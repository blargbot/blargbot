export function clamp<T extends { valueOf(): number | bigint | string; }>(value: T, lower: T, upper: T): T {
    if (lower > upper)
        [lower, upper] = [upper, lower];

    return value < lower ? lower
        : value > upper ? upper
            : value;
}
