export function smartJoin<T>(values: T[], separator: string, lastSeparator: string): string {
    switch (values.length) {
        case 0: return '';
        case 1: return `${values[0]}`;
        case 2: return `${values[0]}${lastSeparator}${values[1]}`;
        default: return `${values.slice(0, -1).join(separator)}${lastSeparator}${values[values.length - 1]}`;
    }
}