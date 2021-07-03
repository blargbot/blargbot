export function toBlocks(text: string): Array<string | number> {
    const regex = /[-+]?\d+(?:\.\d*)?(?:e\+?\d+)?/g;
    const numbers = text.match(regex) ?? [];
    const words = text.split(regex);

    const result = [];
    const max = Math.max(numbers.length, words.length);
    for (let i = 0; i < max; i++) {
        if (i < words.length)
            result.push(words[i]);
        if (i < numbers.length)
            result.push(parseFloat(numbers[i]));
    }
    return result;
}
