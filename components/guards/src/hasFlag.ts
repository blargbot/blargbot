/**
 * @param value The value to check
 * @param flags The flags to test against
 * @returns True if atleast 1 flag matches the value
 */
export function hasFlag(value: number, flag: number, ...otherFlags: readonly number[]): boolean;
export function hasFlag(value: bigint, flag: bigint, ...otherFlags: readonly bigint[]): boolean;
export function hasFlag<T extends number | bigint>(value: T, ...flags: readonly T[]): boolean {
    return flags.some(f => f === (value & f));
}
