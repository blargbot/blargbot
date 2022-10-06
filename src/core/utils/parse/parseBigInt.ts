export function parseBigInt(s: string | number | bigint): bigint | undefined {
    if (typeof s === `bigint`)
        return s;
    try {
        return BigInt(s);
    } catch {
        return undefined;
    }
}
