import { BBTagRuntimeError } from '../BBTagRuntimeError.js';
import { BBTagExpression } from './BBTagExpression.js';
import { BBTagSubtag } from './BBTagSubtag.js';
import type { SourceMarker } from './SourceMarker.js';

interface BBTagSubtagBuilder {
    start: SourceMarker;
    end: SourceMarker;
    readonly name: BBTagExpressionBuilder;
    readonly args: BBTagExpressionBuilder[];
    build(): BBTagSubtag;
}
interface BBTagExpressionBuilder {
    start: SourceMarker;
    end: SourceMarker;
    readonly values: Array<string | BBTagSubtagBuilder>;
    build(): BBTagExpression;
};

export function parseBBTag(source: string, options: { throw: true; }): BBTagExpression
export function parseBBTag(source: string, options?: { throw?: boolean; }): BBTagExpression | BBTagRuntimeError
export function parseBBTag(source: string, options?: { throw?: boolean; }): BBTagExpression | BBTagRuntimeError {
    const result = createExpression(source);
    const subtags: BBTagSubtagBuilder[] = [];
    let expression = result;
    let subtag: BBTagSubtagBuilder | undefined;

    for (const token of tokenize(source)) {
        switch (token.type) {
            case SourceTokenType.STARTSUBTAG:
                if (subtag !== undefined)
                    subtags.push(subtag);
                expression.values.push(subtag = createSubtagCall(source, token));
                expression = subtag.name;
                expression.start = token.end;
                break;
            case SourceTokenType.ARGUMENTDELIMITER:
                if (subtag === undefined)
                    expression.values.push(token.content);
                else {
                    trim(expression);
                    subtag.args.push(expression = createExpression(source, token));
                }
                break;
            case SourceTokenType.ENDSUBTAG:
                if (subtag === undefined) {
                    const error = new BBTagRuntimeError(`Unexpected '}' at ${token.start.index}`);
                    if (options?.throw === true)
                        throw error;
                    return error;
                }
                trim(expression);
                subtag.end = token.end;
                subtag = subtags.pop();
                expression = subtag === undefined ? result : currentStatement(subtag);
                expression.end = token.end;
                break;
            case SourceTokenType.CONTENT:
                expression.end = token.end;
                if (token.content.length === 0)
                    break;
                expression.values.push(token.content);
                break;
        }
    }

    if (subtag !== undefined) {
        const error = new BBTagRuntimeError(`Unmatched '{' at ${subtag.start.index}`);
        if (options?.throw === true)
            throw error;
        return error;
    }

    trim(result);
    return result.build();
}

function* tokenize(source: string): IterableIterator<SourceToken> {
    const marker: Mutable<SourceMarker> = {
        index: 0,
        line: 0,
        column: 0
    };

    let previous = { ...marker };

    function token(type: SourceTokenType, start: SourceMarker, end: SourceMarker): SourceToken {
        return {
            type: type,
            content: source.slice(start.index, end.index),
            start: { ...start },
            end: { ...end }
        };
    }
    function* tokens(type: SourceTokenType): IterableIterator<SourceToken> {
        yield token(SourceTokenType.CONTENT, previous, marker);
        yield token(type, marker, previous = {
            index: marker.index + 1,
            column: marker.column + 1,
            line: marker.line
        });
    }

    for (marker.index = 0; marker.index < source.length; marker.index++, marker.column++) {
        switch (source[marker.index]) {
            case '{':
                yield* tokens(SourceTokenType.STARTSUBTAG);
                break;
            case ';':
                yield* tokens(SourceTokenType.ARGUMENTDELIMITER);
                break;
            case '}':
                yield* tokens(SourceTokenType.ENDSUBTAG);
                break;
            case '\n':
                marker.line++;
                marker.column = -1;
                break;
        }
    }
    yield token(SourceTokenType.CONTENT, previous, marker);
}

function createExpression(source: string, token?: SourceToken): BBTagExpressionBuilder {
    return {
        start: token?.end ?? { index: 0, line: 0, column: 0 },
        end: token?.end ?? { index: 0, line: 0, column: 0 },
        values: [],
        build() {
            return new BBTagExpression(
                this.values.map(v => typeof v === 'string' ? v : v.build()),
                this.start,
                this.end,
                source
            );
        }
    };
}

function createSubtagCall(source: string, token?: SourceToken): BBTagSubtagBuilder {
    return {
        name: createExpression(source),
        args: [],
        start: token?.start ?? { index: 0, line: 0, column: 0 },
        end: token?.end ?? { index: 0, line: 0, column: 0 },
        build() {
            return new BBTagSubtag(
                this.name.build(),
                this.args.map(a => a.build()),
                this.start,
                this.end,
                source
            );
        }
    };
}

function currentStatement(subtag: BBTagSubtagBuilder): BBTagExpressionBuilder {
    if (subtag.args.length === 0)
        return subtag.name;
    return subtag.args[subtag.args.length - 1];
}

function trim(str: BBTagExpressionBuilder): void {
    modify(str.values, 0, str => str.trimStart());
    modify(str.values, str.values.length - 1, str => str.trimEnd());
}

function modify(str: BBTagExpressionBuilder['values'], index: number, mod: (str: string) => string): void {
    if (str.length === 0)
        return;

    let elem = str[index];
    if (typeof elem !== 'string')
        return;

    elem = mod(elem);
    if (elem.length === 0)
        str.splice(index, 1);
    else
        str[index] = elem;
}

export interface SourceToken {
    type: SourceTokenType;
    content: string;
    start: SourceMarker;
    end: SourceMarker;
}

export type SourceTokenType = typeof SourceTokenType[keyof typeof SourceTokenType];
// eslint-disable-next-line @typescript-eslint/naming-convention
export const SourceTokenType = Object.freeze({
    CONTENT: 0,
    STARTSUBTAG: 1,
    ENDSUBTAG: 2,
    ARGUMENTDELIMITER: 3
});
