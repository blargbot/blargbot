export function truncate(text: string, maxLength: number, truncated = ''): string {
    if (text.length < maxLength)
        return text;
    if (truncated.length > 0)
        truncated = ' ' + truncated;
    return text.substring(0, maxLength - 3 - truncated.length) + '...' + truncated;
}
