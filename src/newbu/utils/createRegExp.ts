import isSafeRegex from 'safe-regex';

export function createRegExp(term: string): RegExp {
    if (term.length > 2000)
        throw new Error('Regex too long');

    const segments = /^\/?(.*)\/(.*)/.exec(term);
    if (!segments)
        throw new Error('Invalid Regex');


    const result = new RegExp(segments[1], segments[2]);

    if (!isSafeRegex(result))
        throw new Error('Unsafe Regex');

    return result;
}
