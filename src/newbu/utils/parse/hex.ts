export function hex(value: number, padding: number = 2) {
    return value.toString(16).padStart(padding, '0');
}