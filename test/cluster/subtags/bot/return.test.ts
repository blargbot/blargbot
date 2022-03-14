import { ReturnSubtag } from '@blargbot/cluster/subtags/bot/return';
import { BBTagRuntimeState } from '@blargbot/cluster/types';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ReturnSubtag(),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: 'abc{return}def',
            expected: 'abc',
            assert(ctx) {
                expect(ctx.data.state).to.equal(BBTagRuntimeState.ABORT);
            }
        },
        {
            code: '{return;true}',
            expected: '',
            assert(ctx) {
                expect(ctx.data.state).to.equal(BBTagRuntimeState.ABORT);
            }
        },
        {
            code: 'abc{return;false}def',
            expected: 'abc',
            assert(ctx) {
                expect(ctx.data.state).to.equal(BBTagRuntimeState.RETURN);
            }
        },
        {
            code: '{return;abc}',
            expected: '',
            assert(ctx) {
                expect(ctx.data.state).to.equal(BBTagRuntimeState.ABORT);
            }
        }
    ]
});
