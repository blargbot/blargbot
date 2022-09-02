export const smartSplit = Object.assign(function smartSplit(source: string, limit = 0): string[] {
    return [...smartSplitIterLimit(source, limit)];
}, {
    inverse(source: string[]) {
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
});

export function* smartSplitRanges(source: string): Generator<{ start: number; end: number; value: string; }> {
    for (const { start, end, content } of smartSplitIter(source)) {
        yield { start, end, value: content };
    }
}

interface SmartSplitItem {
    readonly ranges: readonly CharRange[];
    readonly content: string;
    readonly start: number;
    readonly end: number;
}

interface CharRange {
    readonly start: number;
    readonly end: number;
    readonly content: string;
}

interface SmartSplitTokenContext {
    readonly source: string;
    readonly ranges: CharRange[];
    index: number;
    readonly tokenCount: number;
    getToken(offset?: number): SmartSplitToken;
    digestRanges(): Generator<SmartSplitItem>;
}

const enum SmartSplitTokenType {
    LITERAL,
    QUOTE,
    BREAK,
    ESCAPE
}

interface SmartSplitToken {
    readonly type: SmartSplitTokenType;
    readonly start: number;
    readonly end: number;
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

function* tokenize(source: string): Generator<SmartSplitToken> {
    let literalStart: number | undefined;
    let i = 0;

    function* yieldBlock(): Generator<SmartSplitToken> {
        if (literalStart !== undefined) {
            yield { type: SmartSplitTokenType.LITERAL, start: literalStart, end: i };
            literalStart = undefined;
        }
    }

    for (; i < source.length; i++) {
        switch (source[i]) {
            case ' ':
                yield* yieldBlock();
                yield { type: SmartSplitTokenType.BREAK, start: i, end: i + 1 };
                break;
            case '"':
                yield* yieldBlock();
                yield { type: SmartSplitTokenType.QUOTE, start: i, end: i + 1 };
                break;
            case '\\':
                yield* yieldBlock();
                yield { type: SmartSplitTokenType.ESCAPE, start: i, end: i + 1 };
                break;
            default:
                literalStart ??= i;
                break;
        }
    }
    yield* yieldBlock();
}

function* smartSplitIter(source: string): Generator<SmartSplitItem> {
    const tokens = [...tokenize(source)];
    if (tokens.length === 0)
        return;

    const ctx: SmartSplitTokenContext = {
        ranges: [],
        index: 0,
        source,
        tokenCount: tokens.length,
        getToken(offset = 0) {
            const index = this.index + offset;
            if (index < 0 || index >= tokens.length)
                return { type: SmartSplitTokenType.BREAK, start: index, end: index };
            return tokens[index];
        },
        * digestRanges() {
            if (this.ranges.length === 0)
                return;

            const ranges = this.ranges.splice(0, this.ranges.length);
            yield {
                start: Math.min(...ranges.map(t => t.start)),
                end: Math.max(...ranges.map(t => t.end)),
                ranges: ranges,
                content: ranges.map(r => r.content).join('')
            };
        }
    };

    for (; ctx.index < ctx.tokenCount; ctx.index++)
        yield* tokenHandlers[tokens[ctx.index].type](ctx);

    yield* ctx.digestRanges();
}

const noTokens = (function* () { /* NO-OP */ })();
const tokenHandlers: Record<SmartSplitTokenType, (context: SmartSplitTokenContext) => Generator<SmartSplitItem>> = {
    [SmartSplitTokenType.BREAK](ctx) {
        return ctx.digestRanges();
    },
    [SmartSplitTokenType.QUOTE](ctx) {
        if (ctx.getToken(-1).type !== SmartSplitTokenType.BREAK)
            return this[SmartSplitTokenType.LITERAL](ctx);

        const maxOffset = ctx.tokenCount - ctx.index;
        let offset = 1;
        for (; offset < maxOffset; offset++)
            if (ctx.getToken(offset).type === SmartSplitTokenType.QUOTE && ctx.getToken(offset + 1).type === SmartSplitTokenType.BREAK)
                break;

        if (offset === maxOffset)
            return this[SmartSplitTokenType.LITERAL](ctx);

        const startToken = ctx.getToken();
        const endToken = ctx.getToken(offset);
        ctx.index += offset;
        ctx.ranges.push({
            start: startToken.start,
            end: endToken.end,
            content: ctx.source.slice(startToken.end, endToken.start)
        });
        return noTokens;
    },
    // eslint-disable-next-line require-yield
    [SmartSplitTokenType.ESCAPE](ctx) {
        const escapeToken = ctx.getToken();
        ctx.index++;
        const valueToken = ctx.getToken();
        ctx.ranges.push({
            start: escapeToken.start,
            end: valueToken.end,
            content: ctx.source.slice(valueToken.start, valueToken.end)
        });
        return noTokens;
    },
    // eslint-disable-next-line require-yield
    [SmartSplitTokenType.LITERAL](ctx) {
        const token = ctx.getToken();
        ctx.ranges.push({
            start: token.start,
            end: token.end,
            content: ctx.source.slice(token.start, token.end)
        });
        return noTokens;
    }
};
