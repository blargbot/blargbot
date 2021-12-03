import isSafeRegex from 'safe-regex';

export function createSafeRegExp(term: string): { state: 'success'; regex: RegExp; } | { state: 'tooLong' | 'invalid' | 'unsafe'; } {
    if (term.length > 2000)
        return { state: 'tooLong' };

    let body: string;
    let flags: string | undefined;

    if (term.startsWith('/')) {
        const flagStart = term.lastIndexOf('/');
        if (flagStart === -1)
            return { state: 'invalid' };
        body = term.slice(1, flagStart);
        flags = term.slice(flagStart + 1);
    } else {
        body = term;
    }

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
