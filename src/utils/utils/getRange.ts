import { parse } from './parse';

export function getRange(from: string | number, to: string | number): number[] {
    from = parse.int(from);
    to = parse.int(to);
    if (isNaN(from) || isNaN(to))
        throw new Error('Invalid from or to');
    const descending = from > to;
    const count = Math.abs(from - to) + 1;
    if (count > 200)
        throw new Error('Range cannot be larger than 200');
    const offset = Math.min(from, to);
    let values = [...Array(count).keys()].map(e => e + offset);
    if (descending)
        values = values.reverse();
    return values;
}