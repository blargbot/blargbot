const lowerLetters = 'abcdefghijklmnopqrstuvwxyz' as const;
const letters = `${lowerLetters}${lowerLetters.toUpperCase()}` as const;
const letterMap: { [P in Letter]: 0; } = Object.fromEntries(letters.split('').map(l => [l, 0] as const));
const letterLookup = new Set<string>(Object.keys(letterMap));

export const isLetter = Object.assign(function isLetter(value: string): value is Letter {
    return letterLookup.has(value);
}, {
    letters: letters.split('')
});
