import assert from 'node:assert/strict';

import { ReplaceSubtag } from '@blargbot/bbtag/subtags/misc/replace.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new ReplaceSubtag(),
    argCountBounds: { min: 2, max: 3 },
    cases: [
        {
            code: '{replace;abc;123}',
            expected: '',
            assert(ctx) {
                assert.deepEqual(ctx.data.replace, { regex: 'abc', with: '123' });
            }
        },
        { code: '{replace;This is a test;is;aaaa}', expected: 'Thaaaa is a test' }
    ]
});
