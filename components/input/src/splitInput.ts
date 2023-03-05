export function* splitInput(source: string, limit = 0): Generator<StringSlice, void, undefined> {
    if (limit <= 0)
        return yield* splitInputIter(source);

    const iter = splitInputIter(source);
    for (let i = 0; i < limit - 1; i++) {
        const next = iter.next();
        if (next.done === true)
            return;

        yield next.value;
    }

    const remainder = [];
    let next;
    while ((next = iter.next()).done !== true) {
        remainder.push(next.value);
    }
    if (remainder.length > 0)
        yield aggregateSlices(remainder);
}

function* splitInputIter(source: string): Generator<StringSlice, void, undefined> {
    const tokens = [...tokenize(source)];
    if (tokens.length === 0)
        return;

    const ctx: SplitInputContext = {
        ranges: [],
        index: 0,
        tokenCount: tokens.length,
        getToken(offset = 0) {
            const index = this.index + offset;
            if (index < 0 || index >= tokens.length)
                return { type: SplitInputTokenType.BREAK, start: index, end: index, content: '' };
            return tokens[index];
        },
        * digestRanges() {
            if (this.ranges.length === 0)
                return;
            yield aggregateSlices(this.ranges.splice(0, this.ranges.length));
        }
    };

    for (; ctx.index < ctx.tokenCount; ctx.index++)
        yield* tokenHandlers[tokens[ctx.index].type](ctx);

    yield* ctx.digestRanges();
}

function aggregateSlices(ranges: readonly StringSlice[]): StringSlice {
    return {
        start: Math.min(...ranges.map(t => t.start)),
        end: Math.max(...ranges.map(t => t.end)),
        value: ranges.map(r => r.value).join('')
    };
}

export interface StringSlice {
    readonly start: number;
    readonly end: number;
    readonly value: string;
}

interface SplitInputContext {
    readonly ranges: StringSlice[];
    index: number;
    readonly tokenCount: number;
    getToken(offset?: number): SplitInputToken;
    digestRanges(): Generator<StringSlice>;
}

const enum SplitInputTokenType {
    LITERAL,
    QUOTE,
    BREAK
}

interface SplitInputToken {
    readonly type: SplitInputTokenType;
    readonly start: number;
    readonly end: number;
    get content(): string;
}

function* tokenize(source: string): Generator<SplitInputToken> {
    let literalStart: number | undefined;
    let i = 0;

    function* yieldBlock(): Generator<SplitInputToken> {
        if (literalStart !== undefined) {
            yield {
                type: SplitInputTokenType.LITERAL,
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
            case ' ':
                yield* yieldBlock();
                yield { type: SplitInputTokenType.BREAK, start: i, end: i + 1, content: ' ' };
                break;
            case '"':
                yield* yieldBlock();
                yield { type: SplitInputTokenType.QUOTE, start: i, end: i + 1, content: '"' };
                break;
            case '\\':
                yield* yieldBlock();
                yield {
                    type: SplitInputTokenType.LITERAL,
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

const noTokens = (function* () { /* NO-OP */ })();
const tokenHandlers: Record<SplitInputTokenType, (context: SplitInputContext) => Generator<StringSlice>> = {
    [SplitInputTokenType.BREAK](ctx) {
        return ctx.digestRanges();
    },
    [SplitInputTokenType.QUOTE](ctx) {
        if (ctx.getToken(-1).type !== SplitInputTokenType.BREAK)
            return this[SplitInputTokenType.LITERAL](ctx);

        const maxOffset = ctx.tokenCount - ctx.index;
        const tokens = [];
        let offset = 1;
        for (; offset < maxOffset; offset++) {
            const token = ctx.getToken(offset);
            if (token.type === SplitInputTokenType.QUOTE && ctx.getToken(offset + 1).type === SplitInputTokenType.BREAK)
                break;
            tokens.push(token);
        }

        if (offset === maxOffset)
            return this[SplitInputTokenType.LITERAL](ctx);

        const startToken = ctx.getToken();
        const endToken = ctx.getToken(offset);
        ctx.index += offset;
        ctx.ranges.push({
            start: startToken.start,
            end: endToken.end,
            value: tokens.map(t => t.content).join('')
        });
        return noTokens;
    },
    [SplitInputTokenType.LITERAL](ctx) {
        const token = ctx.getToken();
        ctx.ranges.push({
            start: token.start,
            end: token.end,
            value: token.content
        });
        return noTokens;
    }
};
