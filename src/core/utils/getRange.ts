export function getRange(from: number, to: number, { maxCount = 200 } = {}): number[] {
    return [...iterRange(from, to, { maxCount })];
}

export function* iterRange(from: number, to: number, { maxCount = 200 } = {}): IterableIterator<number> {
    if (isNaN(from) || isNaN(to))
        throw new Error('Invalid from or to');
    if (maxCount > 0) {
        const count = Math.abs(from - to) + 1;
        if (count > maxCount)
            throw new Error(`Range cannot be larger than ${maxCount}`);
    }
    const step = from > to ? -1 : 1;
    for (let i = from; i <= to; i += step)
        yield i;
}