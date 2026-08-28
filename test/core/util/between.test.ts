import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { between } from '@blargbot/core/utils/index.js';

await describe('between', async () => {
    const data: Array<[value: number, lower: number, upper: number, inclusive: boolean, expected: boolean]> = [
        [5, 0, 10, true, true],
        [5, 0, 10, false, true],
        [5, 10, 0, true, true],
        [5, 10, 0, false, true],
        [17, 17, 23, false, false],
        [17, 17, 23, true, true],
        [18, 9, 18, false, false],
        [18, 9, 18, true, true]
    ];

    for (const [value, lower, upper, inclusive, expected] of data) {
        await it(`should identify ${value} as${expected ? '' : ' not'} being between ${lower} and ${upper} (${inclusive ? 'inclusive' : 'exclusive'})`, () => {
            assert.equal(between(value, lower, upper, inclusive), expected);
        });
    }
});
