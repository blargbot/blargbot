import { ReturnSubtag } from '@blargbot/bbtag/subtags/bot/return.js';
import { BBTagRuntimeState } from '@blargbot/bbtag/types.js';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new ReturnSubtag(),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: 'abc{return}def',
            expected: 'abc',
            assert(ctx) {
                chai.expect(ctx.data.state).to.equal(BBTagRuntimeState.ABORT);
            }
        },
        {
            code: '{return;true}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.data.state).to.equal(BBTagRuntimeState.ABORT);
            }
        },
        {
            code: 'abc{return;false}def',
            expected: 'abc',
            assert(ctx) {
                chai.expect(ctx.data.state).to.equal(BBTagRuntimeState.RETURN);
            }
        },
        {
            code: '{return;abc}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.data.state).to.equal(BBTagRuntimeState.ABORT);
            }
        }
    ]
});
