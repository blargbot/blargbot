import assert from 'node:assert/strict';

import { ReturnSubtag } from '@blargbot/bbtag/subtags/bot/return.js';
import { BBTagRuntimeState } from '@blargbot/bbtag/types.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new ReturnSubtag(),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: 'abc{return}def',
            expected: 'abc',
            assert(ctx) {
                assert.equal(ctx.data.state, BBTagRuntimeState.ABORT);
            }
        },
        {
            code: '{return;true}',
            expected: '',
            assert(ctx) {
                assert.equal(ctx.data.state, BBTagRuntimeState.ABORT);
            }
        },
        {
            code: 'abc{return;false}def',
            expected: 'abc',
            assert(ctx) {
                assert.equal(ctx.data.state, BBTagRuntimeState.RETURN);
            }
        },
        {
            code: '{return;abc}',
            expected: '',
            assert(ctx) {
                assert.equal(ctx.data.state, BBTagRuntimeState.ABORT);
            }
        }
    ]
});
