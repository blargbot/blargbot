import type { BBTagCallToken } from './BBTagCallToken.js';
import type { BBTagStatementToken } from './BBTagStatementToken.js';
import type { SourceMarker } from './SourceMarker.js';

type ToMutable<T> = T extends ReadonlyArray<infer E> ? Array<ToMutable<E>>
    : T extends BBTagCallToken ? MutableSubtagCall
    : T extends BBTagStatementToken ? MutableStatement
    : T;

type MutableSubtagCall = { -readonly [P in keyof BBTagCallToken]: ToMutable<BBTagCallToken[P]> }
type MutableStatement = { -readonly [P in keyof BBTagStatementToken]: ToMutable<BBTagStatementToken[P]> };

export function parseBBTag(source: string): BBTagStatementToken {
    const result = createStatement(source);
    const subtags: MutableSubtagCall[] = [];
    let statement = result;
    let subtag: MutableSubtagCall | undefined;

    for (const token of tokenize(source)) {
        switch (token.type) {
            case SourceTokenType.STARTSUBTAG:
                if (subtag !== undefined)
                    subtags.push(subtag);
                statement.values.push(subtag = createSubtagCall(source, token));
                statement = subtag.name;
                statement.start = token.end;
                break;
            case SourceTokenType.ARGUMENTDELIMITER:
                if (subtag === undefined)
                    statement.values.push(token.content);
                else {
                    trim(statement);
                    subtag.args.push(statement = createStatement(source, token));
                }
                break;
            case SourceTokenType.ENDSUBTAG:
                if (subtag === undefined) {
                    const result = createStatement(source);
                    result.values.push(`\`Unexpected '}' at ${token.start.index}\``);
                    return result;
                }
                trim(statement);
                subtag.end = token.end;
                subtag = subtags.pop();
                statement = subtag === undefined ? result : currentStatement(subtag);
                statement.end = token.end;
                break;
            case SourceTokenType.CONTENT:
                statement.end = token.end;
                if (token.content.length === 0)
                    break;
                statement.values.push(token.content);
                break;
        }
    }

    if (subtag !== undefined) {
        const result = createStatement(source);
        result.values.push(`\`Unmatched '{' at ${subtag.start.index}\``);
        return result;
    }

    trim(result);
    return result;
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

function createStatement(source: string, token?: SourceToken): MutableStatement {
    return {
        start: token?.end ?? { index: 0, line: 0, column: 0 },
        end: token?.end ?? { index: 0, line: 0, column: 0 },
        get source() { return source.slice(this.start.index, this.end.index); },
        values: []
    };
}

function createSubtagCall(source: string, token?: SourceToken): MutableSubtagCall {
    return {
        name: createStatement(source),
        args: [],
        start: token?.start ?? { index: 0, line: 0, column: 0 },
        end: token?.end ?? { index: 0, line: 0, column: 0 },
        get source() { return source.slice(this.start.index, this.end.index); }
    };
}

function currentStatement(subtag: MutableSubtagCall): MutableStatement {
    if (subtag.args.length === 0)
        return subtag.name;
    return subtag.args[subtag.args.length - 1];
}

function trim(str: MutableStatement): void {
    modify(str.values, 0, str => str.trimStart());
    modify(str.values, str.values.length - 1, str => str.trimEnd());
}

function modify(str: MutableStatement['values'], index: number, mod: (str: string) => string): void {
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

export const enum SourceTokenType {
    CONTENT,
    STARTSUBTAG,
    ENDSUBTAG,
    ARGUMENTDELIMITER
}
