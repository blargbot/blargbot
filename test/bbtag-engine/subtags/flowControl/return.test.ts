import assert from 'node:assert/strict';

import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.returnReplacer,
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: 'abc{return}def',
            expected: 'abc',
            assert(ctx) {
                assert.equal(ctx.returnDepth, Infinity);
            }
        },
        {
            code: '{return;true}',
            expected: '',
            assert(ctx) {
                assert.equal(ctx.returnDepth, Infinity);
            }
        },
        {
            code: 'abc{return;false}def',
            expected: 'abc',
            assert(ctx) {
                assert.equal(ctx.returnDepth, 1);
            }
        },
        {
            code: '{return;abc}',
            expected: '',
            assert(ctx) {
                assert.equal(ctx.returnDepth, Infinity);
            }
        }
    ]
});
