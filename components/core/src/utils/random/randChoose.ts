import { randInt } from './randInt';

export function randChoose<T>(choices: Iterable<T>): T;
export function randChoose<T>(choices: Iterable<T>, count: number): T[];
export function randChoose<T>(choices: Iterable<T>, count?: number): T | T[] {
    const arr = [...choices];
    if (count === undefined)
        return arr[randInt(0, arr.length, false)];

    const result = [];
    for (let i = 0; i < count; i++)
        result.push(arr[randInt(0, arr.length, false)]);
    return result;
}
