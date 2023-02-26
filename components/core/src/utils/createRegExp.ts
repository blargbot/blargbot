import isSafeRegex from 'safe-regex';

export function createSafeRegExp(term: string): { success: true; value: RegExp; } | { success: false; reason: 'tooLong' | 'invalid' | 'unsafe'; } {
    if (term.length > 2000)
        return { success: false, reason: 'tooLong' };

    const match = /^\/?(?<body>.+?)\/(?<flags>[igmsuy]*)$/.exec(term);
    if (match === null)
        return { success: false, reason: 'invalid' };

    const { body, flags } = match.groups ?? {};
    const result = new RegExp(body, flags);

    if (!isSafeRegex(result))
        return { success: false, reason: 'unsafe' };

    return { success: true, value: result };
}

export function matchRegexSafe(term: string, text: string): string[] | undefined {
    const result = createSafeRegExp(term);
    if (!result.success)
        return undefined;
    return text.match(result.value)?.map((s: string | undefined) => s ?? '') ?? undefined;
}
