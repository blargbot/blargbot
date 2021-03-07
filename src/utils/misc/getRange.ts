import { int as parseInt } from '../parse/int';

export function getRange(from: string | number, to: string | number, maxCount = 200): number[] {
    return [...iterRange(from, to, maxCount)];
}

export function* iterRange(from: string | number, to: string | number, maxCount = 200): IterableIterator<number> {
    from = parseInt(from);
    to = parseInt(to);
    if (isNaN(from) || isNaN(to))
        throw new Error('Invalid from or to');
    const count = Math.abs(from - to) + 1;
    if (count > maxCount)
        throw new Error(`Range cannot be larger than ${maxCount}`);
    const step = from > to ? -1 : 1;
    for (let i = from; i <= to; i += step)
        yield i;
}