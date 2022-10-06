export function parseHex(value: number, padding = 2): string {
    return value.toString(16).padStart(padding, `0`);
}
