import isSafeRegex from 'safe-regex';

export function createRegExp(term: string) {
    if (term.length > 2000)
        throw new Error('Regex too long');

    let segments = term.match(/^\/?(.*)\/(.*)/);
    if (!segments)
        throw new Error('Invalid Regex');


    let result = new RegExp(segments[1], segments[2]);

    if (!isSafeRegex(result))
        throw new Error('Unsafe Regex');

    return result;
}
