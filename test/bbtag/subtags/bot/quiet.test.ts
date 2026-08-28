import assert from 'node:assert/strict';

import { QuietSubtag } from '@blargbot/bbtag/subtags/bot/quiet.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new QuietSubtag(),
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
