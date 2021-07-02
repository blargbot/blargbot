import isSafeRegex from 'safe-regex';

export function createSafeRegExp(term: string): { success: true, regex: RegExp } | { success: false, reason: 'tooLong' | 'invalid' | 'unsafe' } {
    if (term.length > 2000)
        return { success: false, reason: 'tooLong' };

    let body: string;
    let flags: string | undefined;

    if (term.startsWith('/')) {
        const flagStart = term.lastIndexOf('/');
        if (flagStart === -1)
            return { success: false, reason: 'invalid' };
        body = term.slice(0, flagStart);
        flags = term.slice(flagStart + 1);
    } else {
        body = term;
    }

    const result = new RegExp(body, flags);

    if (!isSafeRegex(result))
        return { success: false, reason: 'unsafe' };

    return { success: true, regex: result };
}

export function testRegexSafe(term: string, text: string): boolean {
    const result = createSafeRegExp(term);
    if (!result.success)
        return false;
    return result.regex.test(text);
}
