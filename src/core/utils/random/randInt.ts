export function randInt(min: number, max: number, upperInclusive = true): number {
    return Math.floor(Math.random() * (max - min + (upperInclusive ? 1 : 0))) + min;
}