/**
 * @param value The value to check
 * @param flags The flags to test against
 * @returns True if atleast 1 flag matches the value
 */
export function hasFlag<T extends number | bigint>(value: T, flag: T, ...otherFlags: T[]): boolean;
export function hasFlag<T extends number | bigint>(value: T, ...flags: T[]): boolean {
    return flags.some(f => f === (value & f));
}
