const lowerLetters = 'abcdefghijklmnopqrstuvwxyz' as const;
const letters = `${lowerLetters}${lowerLetters.toUpperCase()}` as const;
const numbers = '0123456789';
const alphanumeric = `${letters}${numbers}` as const;
const alphanumericMap: { [P in Alphanumeric]: 0 } = Object.fromEntries(alphanumeric.split('').map(l => [l, 0] as const));
const alphanumericLookup = new Set<string>(Object.keys(alphanumericMap));

export const isFlagChar = Object.assign(function isFlagChar(value: string): value is Alphanumeric {
    return alphanumericLookup.has(value);
}, {
    accept: alphanumeric.split('')
});
