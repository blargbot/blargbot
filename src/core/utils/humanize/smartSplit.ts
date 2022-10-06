export const smartSplit = Object.assign(function smartSplit(source: string, limit = 0): string[] {
    return [...smartSplitIterLimit(source, limit)];
}, {
    inverse(source: string[]) {
        const results = [];
        for (const item of source) {
            const escaped = item.replace(/["\\]/g, m => `\\${m}`);
            if (escaped.length === 0)
                results.push(`""`);
            else if (escaped.includes(` `))
                results.push(`"${escaped}"`);
            else
                results.push(escaped);

        }
        return results.join(` `);
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
    readonly ranges: CharRange[];
    index: number;
    readonly tokenCount: number;
    getToken(offset?: number): SmartSplitToken;
    digestRanges(): Generator<SmartSplitItem>;
}

const enum SmartSplitTokenType {
    LITERAL,
    QUOTE,
    BREAK
}

interface SmartSplitToken {
    readonly type: SmartSplitTokenType;
    readonly start: number;
    readonly end: number;
    get content(): string;
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
            yield {
                type: SmartSplitTokenType.LITERAL,
                start: literalStart,
                end: i,
                get content() {
                    return source.slice(this.start, this.end);
                }
            };
            literalStart = undefined;
        }
    }

    for (; i < source.length; i++) {
        switch (source[i]) {
            case ` `:
                yield* yieldBlock();
                yield { type: SmartSplitTokenType.BREAK, start: i, end: i + 1, content: ` ` };
                break;
            case `"`:
                yield* yieldBlock();
                yield { type: SmartSplitTokenType.QUOTE, start: i, end: i + 1, content: `"` };
                break;
            case `\\`:
                yield* yieldBlock();
                yield {
                    type: SmartSplitTokenType.LITERAL,
                    start: i,
                    end: ++i + 1,
                    get content() {
                        return source.slice(this.start + 1, this.end);
                    }
                };
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
        tokenCount: tokens.length,
        getToken(offset = 0) {
            const index = this.index + offset;
            if (index < 0 || index >= tokens.length)
                return { type: SmartSplitTokenType.BREAK, start: index, end: index, content: `` };
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
                content: ranges.map(r => r.content).join(``)
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
        const tokens = [];
        let offset = 1;
        for (; offset < maxOffset; offset++) {
            const token = ctx.getToken(offset);
            if (token.type === SmartSplitTokenType.QUOTE && ctx.getToken(offset + 1).type === SmartSplitTokenType.BREAK)
                break;
            tokens.push(token);
        }

        if (offset === maxOffset)
            return this[SmartSplitTokenType.LITERAL](ctx);

        const startToken = ctx.getToken();
        const endToken = ctx.getToken(offset);
        ctx.index += offset;
        ctx.ranges.push({
            start: startToken.start,
            end: endToken.end,
            content: tokens.map(t => t.content).join(``)
        });
        return noTokens;
    },
    [SmartSplitTokenType.LITERAL](ctx) {
        const token = ctx.getToken();
        ctx.ranges.push({
            start: token.start,
            end: token.end,
            content: token.content
        });
        return noTokens;
    }
};
