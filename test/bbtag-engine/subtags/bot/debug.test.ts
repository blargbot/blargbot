import assert from 'node:assert/strict';

import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.debugReplacer,
    argCountBounds: { min: 0, max: Infinity },
    cases: [
        {
            code: '{debug}',
            expected: '',
            assert(ctx) {
                assert.equal(ctx.debug.length, 1);
                assert.equal(ctx.debug[0].text, '');
                assert.equal(ctx.debug[0].subtag.start.index, 0);
                assert.equal(ctx.debug[0].subtag.end.index, 7);
            }
        },
        {
            code: '{debug;some text!}',
            expected: '',
            assert(ctx) {
                assert.equal(ctx.debug.length, 1);
                assert.equal(ctx.debug[0].text, 'some text!');
                assert.equal(ctx.debug[0].subtag.start.index, 0);
                assert.equal(ctx.debug[0].subtag.end.index, 18);
            }
        },
        {
            code: '{debug;some text!;and some more;ooh fancy}',
            expected: '',
            assert(ctx) {
                assert.equal(ctx.debug.length, 1);
                assert.equal(ctx.debug[0].text, 'some text! and some more ooh fancy');
                assert.equal(ctx.debug[0].subtag.start.index, 0);
                assert.equal(ctx.debug[0].subtag.end.index, 42);
            }
        }
    ]
});
