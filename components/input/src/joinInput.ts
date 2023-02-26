export function joinInput(source: readonly string[]): string {
    const results = [];
    for (const item of source) {
        const escaped = item.replace(/["\\]/g, m => `\\${m}`);
        if (escaped.length === 0)
            results.push('""');
        else if (escaped.includes(' '))
            results.push(`"${escaped}"`);
        else
            results.push(escaped);

    }
    return results.join(' ');
}
