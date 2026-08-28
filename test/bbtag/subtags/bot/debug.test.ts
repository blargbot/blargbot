import assert from 'node:assert/strict';

import { DebugSubtag } from '@blargbot/bbtag/subtags/bot/debug.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new DebugSubtag(),
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
