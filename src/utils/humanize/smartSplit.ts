export function smartSplit(source: string, limit = 0): string[] {
    return [...smartSplitIterLimit(source, limit)];
}

export function* smartSplitRanges(source: string): Generator<{ start: number, end: number }> {
    for (const { start, end } of smartSplitIter(source)) {
        yield { start, end };
    }
}

interface SmartSplitItem {
    readonly ranges: CharRange[];
    readonly content: string;
    readonly start: number;
    readonly end: number;
}

interface CharRange {
    readonly start: number;
    readonly end: number;
    readonly content: string;
}

function* smartSplitIterLimit(source: string, limit: number): Generator<string> {
    for (const { content, start } of smartSplitIter(source)) {
        if (limit-- === 1) {
            yield source.slice(start);
            break;
        } else {
            yield content;
        }
    }
}

function* smartSplitIter(source: string): Generator<SmartSplitItem> {
    let quote: string | undefined;
    let builder = [];
    let start: number | undefined;

    for (let i = 0; i < source.length; i++) {
        switch (source[i]) {
            case '\\': {
                start ??= i;
                const char = source[++i];
                if (char !== undefined)
                    builder.push(i);
                break;
            }
            case '"':
            case '\'': {
                start ??= i;
                const char = source[i];
                if (quote === char)
                    quote = undefined;
                else if (quote === undefined)
                    quote = char;
                else
                    builder.push(i);
                break;
            }
            case ' ': {
                if (quote !== undefined)
                    builder.push(i);
                else if (start !== undefined) {
                    yield createSplitItem(source, builder, start, i - 1);
                    start = undefined;
                    builder = [];
                }
                break;
            }
            default: {
                start ??= i;
                builder.push(i);
                break;
            }
        }
    }
    if (start !== undefined)
        yield createSplitItem(source, builder, start, source.length - 1);
}

function createSplitItem(source: string, charIndexes: number[], start: number, end: number): SmartSplitItem {
    const ranges = charIndexes.reduce((ranges, index) => {
        const prevRange = ranges[ranges.length - 1] ?? [index, index];
        if (prevRange[1] === index - 1) {
            prevRange[1] = index;
        } else {
            ranges.push([index, index]);
        }
        return ranges;
    }, <Array<[number, number]>>[])
        .map(([start, end]) => ({
            start,
            end,
            content: source.slice(start, end + 1)
        }));

    return {
        ranges: ranges,
        content: ranges.map(r => r.content).join(),
        end,
        start
    };
}
