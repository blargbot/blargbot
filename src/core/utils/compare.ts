import { toBlocks } from './toBlocks';

export function compare(a: string, b: string): number {
    const aBlocks = toBlocks('' + a);
    const bBlocks = toBlocks('' + b);

    const pairs = [];
    const max = Math.max(aBlocks.length, bBlocks.length);
    for (let i = 0; i < max; i++)
        pairs.push([aBlocks[i], bBlocks[i]]);

    let result: -1 | 0 | 1 = 0;
    for (const pair of pairs) {
        //If they are already identical, no need to keep checking.
        if (pair[0] === pair[1]) continue;
        if (typeof pair[0] === 'number') result -= 1;
        if (typeof pair[1] === 'number') result += 1;
        if (result !== 0) return result; //Only one of them is a number

        if (pair[0] > pair[1]) return 1;
        if (pair[0] < pair[1]) return -1;

        //They are not equal, they are not bigger or smaller than eachother.
        //They are strings or numbers. Only NaN satisfies this condition
        if (isNaN(<number>pair[0])) result -= 1;
        if (isNaN(<number>pair[1])) result += 1;
        if (result !== 0) return result;

        //They are both NaN, so continue checking
    }

    //All pairs are identical
    return 0;
}
