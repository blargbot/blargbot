const lowerLetters = 'abcdefghijklmnopqrstuv';
const digits = '0123456789_';
const flagChars = new Set([
    ...lowerLetters.split(''),
    ...lowerLetters.toUpperCase().split(''),
    ...digits.split('')
]);
type FlagChar = typeof flagChars extends Set<infer R> ? R : never;

export function isFlagChar(value: string): value is FlagChar {
    return flagChars.has(value);
}
