export function smartSplit(source: string, limit = 0): string[] {
    return [...smartSplitIter(source, limit)];
}

export function smartSplitSkip(source: string, count: number): string {
    const iter = smartSplitIter(source, count + 1);
    let value = '';
    for (let i = 0; i <= count; i++) {
        value = iter.next().value;
    }
    return value;
}

function* smartSplitIter(source: string, limit = 0): IterableIterator<string> {
    if (limit === 1)
        return yield source;
    let count = 0;
    let quote: string | undefined;
    let builder = [];
    for (let i = 0; i < source.length; i++) {
        switch (source[i]) {
            case '\\': {
                const char = source[++i];
                if (char !== undefined)
                    builder.push(char);
                break;
            }
            case '"':
            case '\'': {
                const char = source[i];
                if (quote === char)
                    quote = undefined;
                else if (quote === undefined)
                    quote = char;
                else
                    builder.push(char);
                break;
            }
            case ' ': {
                if (quote !== undefined)
                    builder.push(' ');
                else if (builder.length > 0) {
                    yield builder.join('');
                    if (++count === limit - 1)
                        return yield source.substring(++i);
                    builder = [];
                }
                break;
            }
            default: {
                builder.push(source[i]);
                break;
            }
        }
    }
    if (builder.length > 0)
        yield builder.join('');
}
