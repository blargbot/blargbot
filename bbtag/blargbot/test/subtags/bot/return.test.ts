import { BBTagRuntimeState } from '@bbtag/blargbot';
import { ReturnSubtag } from '@bbtag/blargbot/subtags';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: ReturnSubtag,
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: 'abc{return}def',
            expected: 'abc',
            assert(ctx) {
                chai.expect(ctx.runtime.state).to.equal(BBTagRuntimeState.ABORT);
            }
        },
        {
            code: '{return;true}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.runtime.state).to.equal(BBTagRuntimeState.ABORT);
            }
        },
        {
            code: 'abc{return;false}def',
            expected: 'abc',
            assert(ctx) {
                chai.expect(ctx.runtime.state).to.equal(BBTagRuntimeState.RUNNING);
            }
        },
        {
            code: '{return;abc}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.runtime.state).to.equal(BBTagRuntimeState.ABORT);
            }
        }
    ]
});
