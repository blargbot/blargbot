import assert from 'node:assert/strict';
import { it } from 'node:test';

import { Md5Subtag } from '@blargbot/bbtag/subtags/misc/md5.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new Md5Subtag(),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{md5;some cool text here}', expected: 'dc15a13d3e070e8151301f4430d214e7' }
    ],
    async runOtherTests(md5) {
        await it('Should be deprecated', () => {
            assert.equal(md5.deprecated, 'hash');
        });
    }
});
