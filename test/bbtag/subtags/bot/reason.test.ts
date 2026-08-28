import assert from 'node:assert/strict';

import { ReasonSubtag } from '@blargbot/bbtag/subtags/bot/reason.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new ReasonSubtag(),
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
