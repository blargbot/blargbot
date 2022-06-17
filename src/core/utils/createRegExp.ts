import isSafeRegex from 'safe-regex';

export function createSafeRegExp(term: string): { state: 'success'; regex: RegExp; } | { state: 'tooLong' | 'invalid' | 'unsafe'; } {
    if (term.length > 2000)
        return { state: 'tooLong' };

    const match = /^\/?(?<body>.+?)\/(?<flags>[igmsuy]*)$/.exec(term);
    if (match === null)
        return { state: 'invalid' };

    const { body, flags } = match.groups ?? {};
    const result = new RegExp(body, flags);

    if (!isSafeRegex(result))
        return { state: 'unsafe' };

    return { state: 'success', regex: result };
}

export function testRegexSafe(term: string, text: string): boolean {
    const result = createSafeRegExp(term);
    if (result.state !== 'success')
        return false;
    return result.regex.test(text);
}
