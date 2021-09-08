import { SourceMarker, SourceToken, SourceTokenType, Statement, SubtagCall } from '@cluster/types';

type MutableSubtag = { -readonly [P in keyof SubtagCall]: SubtagCall[P] extends readonly Statement[] ? MutableStatement[] : SubtagCall[P] extends Statement ? MutableStatement : SubtagCall[P] };
type MutableStatement = Array<string | MutableSubtag>;

export function parse(source: string): Statement {
    const result: MutableStatement = [];
    const subtags: MutableSubtag[] = [];
    let builder = result;
    let subtag: MutableSubtag | undefined;

    for (const token of tokenize(source)) {
        switch (token.type) {
            case SourceTokenType.STARTSUBTAG:
                if (subtag !== undefined)
                    subtags.push(subtag);
                builder.push(subtag = {
                    name: [],
                    args: [],
                    start: token.start,
                    end: token.end,
                    get source(): string { return source.slice(this.start.index, this.end.index); }
                });
                builder = subtag.name;
                break;
            case SourceTokenType.ARGUMENTDELIMITER:
                if (subtag === undefined)
                    builder.push(token.content);
                else {
                    trim(builder);
                    subtag.args.push(builder = []);
                }
                break;
            case SourceTokenType.ENDSUBTAG:
                if (subtag === undefined)
                    return [`\`Unexpected '${token.content}'\``];
                trim(builder);
                subtag.end = token.end;
                subtag = subtags.pop();
                builder = subtag === undefined ? result : currentBuilder(subtag);
                break;
            case SourceTokenType.CONTENT:
                if (token.content.length === 0)
                    break;
                builder.push(token.content);
                break;
        }
    }

    if (subtag !== undefined)
        return ['`Subtag is missing a \'}\'`'];

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

function currentBuilder(subtag: MutableSubtag): MutableStatement {
    if (subtag.args.length === 0)
        return subtag.name;
    return subtag.args[subtag.args.length - 1];
}

function trim(str: MutableStatement): void {
    modify(str, 0, str => str.trimStart());
    modify(str, str.length - 1, str => str.trimEnd());
}

function modify(str: MutableStatement, index: number, mod: (str: string) => string): void {
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
