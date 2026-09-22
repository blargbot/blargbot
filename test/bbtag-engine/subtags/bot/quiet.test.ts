import assert from 'node:assert/strict';

import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.quietReplacer,
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{quiet}',
            expected: '',
            assert(ctx) {
                assert.equal(ctx.scopes.local.quiet, true);
            }
        },
        {
            code: '{quiet;}',
            expected: '',
            assert(ctx) {
                assert.equal(ctx.scopes.local.quiet, true);
            }
        },
        {
            code: '{quiet;true}',
            expected: '',
            assert(ctx) {
                assert.equal(ctx.scopes.local.quiet, true);
            }
        },
        {
            code: '{quiet;false}',
            expected: '',
            assert(ctx) {
                assert.equal(ctx.scopes.local.quiet, false);
            }
        },
        {
            code: '{quiet;abc}',
            expected: '',
            assert(ctx) {
                assert.equal(ctx.scopes.local.quiet, undefined);
            }
        }
    ]
});
