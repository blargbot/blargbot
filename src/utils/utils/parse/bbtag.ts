import { BBSourceMarker, BBSourceToken, BBSourceTokenType, BBString, BBSubtagCall } from '../../../core/bbtag/types';

export function bbtag(source: string): BBString {
    const result: BBString = [];
    const subtags: BBSubtagCall[] = [];
    let builder = result;
    let subtag: BBSubtagCall | undefined;

    for (const token of tokenize(source)) {
        switch (token.type) {
            case BBSourceTokenType.STARTSUBTAG:
                if (subtag)
                    subtags.push(subtag);
                builder.push(subtag = {
                    name: [],
                    args: [],
                    start: token.start,
                    end: token.end
                });
                builder = subtag.name;
                break;
            case BBSourceTokenType.ARGUMENTDELIMITER:
                if (subtag === undefined)
                    builder.push(token.content);
                else {
                    trim(builder);
                    subtag.args.push(builder = []);
                }
                break;
            case BBSourceTokenType.ENDSUBTAG:
                if (subtag === undefined)
                    throw new Error(`Unexpected '${token.content}' at [${token.start.line}:${token.start.column}]`);
                trim(builder);
                subtag.end = token.end;
                subtag = subtags.pop();
                builder = subtag === undefined ? result : currentBuilder(subtag);
                break;
            case BBSourceTokenType.CONTENT:
                if (token.content.length === 0)
                    break;
                builder.push(token.content);
                break;
        }
    }

    if (subtag !== undefined) {
        throw new Error(`Unterminated subtag at [${subtag.start.line}:${subtag.start.column}]`);
    }

    trim(result);
    return result;
}

function* tokenize(source: string): IterableIterator<BBSourceToken> {
    const marker: BBSourceMarker = {
        index: 0,
        line: 0,
        column: 0
    };

    let previous = { ...marker };

    function token(type: BBSourceTokenType, start: BBSourceMarker, end: BBSourceMarker): BBSourceToken {
        return {
            type: type,
            content: source.slice(start.index, end.index),
            start: { ...start },
            end: { ...end }
        };
    }
    function* tokens(type: BBSourceTokenType): IterableIterator<BBSourceToken> {
        yield token(BBSourceTokenType.CONTENT, previous, marker);
        yield token(type, marker, previous = {
            index: marker.index + 1,
            column: marker.column + 1,
            line: marker.line
        });
    }

    for (marker.index = 0; marker.index < source.length; marker.index++, marker.column++) {
        switch (source[marker.index]) {
            case '{':
                yield* tokens(BBSourceTokenType.STARTSUBTAG);
                break;
            case ';':
                yield* tokens(BBSourceTokenType.ARGUMENTDELIMITER);
                break;
            case '}':
                yield* tokens(BBSourceTokenType.ENDSUBTAG);
                break;
            case '\n':
                marker.line++;
                marker.column = -1;
                break;
        }
    }
    yield token(BBSourceTokenType.CONTENT, previous, marker);
}

function currentBuilder(subtag: BBSubtagCall): BBString {
    if (subtag.args.length === 0)
        return subtag.name;
    return subtag.args[subtag.args.length - 1];
}

function trim(str: BBString): void {
    modify(str, 0, str => str.trimStart());
    modify(str, str.length - 1, str => str.trimEnd());
}

function modify(str: BBString, index: number, mod: (str: string) => string): void {
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