export function toBlocks (text: string): Array<string | number> {
    const regex = /[-+]?\d+(?:\.\d*)?(?:e\+?\d+)?/g;
    const numbers = text.match(regex) || [];
    const words = text.split(regex);

    const result = [];
    const max = Math.max(numbers.length, words.length);
    for (let i = 0; i < max; i++) {
        if (words[i] !== undefined) result.push(words[i]);
        if (numbers[i] !== undefined) result.push(parseFloat(numbers[i]));
    }
    return result;
}