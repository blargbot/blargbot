import { ReturnSubtag } from '@cluster/subtags/bot/return';
import { RuntimeReturnState } from '@cluster/types';
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
                expect(ctx.state.return).to.equal(RuntimeReturnState.ALL);
            }
        },
        {
            code: '{return;true}',
            expected: '',
            assert(ctx) {
                expect(ctx.state.return).to.equal(RuntimeReturnState.ALL);
            }
        },
        {
            code: 'abc{return;false}def',
            expected: 'abc',
            assert(ctx) {
                expect(ctx.state.return).to.equal(RuntimeReturnState.CURRENTTAG);
            }
        },
        {
            code: '{return;abc}',
            expected: '',
            assert(ctx) {
                expect(ctx.state.return).to.equal(RuntimeReturnState.ALL);
            }
        }
    ]
});
