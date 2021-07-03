export function smartJoin(values: unknown[], separator: string, lastSeparator: string): string {
    switch (values.length) {
        case 0:
        case 1:
            return values.join(lastSeparator);
        default:
            return [
                values.slice(0, -1).join(separator),
                values.slice(-1)[0]
            ].join(lastSeparator);
    }
}
