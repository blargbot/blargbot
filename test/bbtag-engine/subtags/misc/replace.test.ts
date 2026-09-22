import assert from 'node:assert/strict';

import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.replaceReplacer,
    argCountBounds: { min: 2, max: 3 },
    cases: [
        {
            code: '{replace;abc;123}',
            expected: '',
            setup(ctx) {
                ctx.locals.setup(m => m.replaceOutput).returns([]);
            },
            assert(ctx) {
                assert.equal(ctx.locals.replaceOutput.length, 1);
                assert.equal(ctx.locals.replaceOutput[0]('This is a test abcdefghi'), 'This is a test 123defghi');
                assert.equal(ctx.locals.replaceOutput[0]('This is a test ab cdefghi'), 'This is a test ab cdefghi');
            }
        },
        { code: '{replace;This is a test;is;aaaa}', expected: 'Thaaaa is a test' }
    ]
});
