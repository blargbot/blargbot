import isSafeRegex from 'safe-regex';

export function createUserRegExpParser(maxLength: number): (text: string) => { success: true; value: RegExp; } | { success: false; reason: 'tooLong' | 'invalid' | 'unsafe'; } {
    return function parseUserRegExp(term: string): { success: true; value: RegExp; } | { success: false; reason: 'tooLong' | 'invalid' | 'unsafe'; } {
        if (term.length > maxLength)
            return { success: false, reason: 'tooLong' };

        const match = /^\/?(?<body>.+?)\/(?<flags>[igmsuy]*)$/.exec(term);
        if (match === null)
            return { success: false, reason: 'invalid' };

        const { body, flags } = match.groups ?? {};
        const result = new RegExp(body, flags);

        if (!isSafeRegex(result))
            return { success: false, reason: 'unsafe' };

        return { success: true, value: result };
    };
}

export const parseUserRegExp = createUserRegExpParser(Infinity);
