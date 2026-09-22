import assert from 'node:assert/strict';

import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.reasonReplacer,
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{reason}',
            expected: '',
            assert(ctx) {
                assert.equal(ctx.scopes.local.reason, '');
            }
        },
        {
            code: '{reason;}',
            expected: '',
            assert(ctx) {
                assert.equal(ctx.scopes.local.reason, '');
            }
        },
        {
            code: '{reason;Because i can}',
            expected: '',
            assert(ctx) {
                assert.equal(ctx.scopes.local.reason, 'Because i can');
            }
        }
    ]
});
