import { ReasonSubtag } from '@blargbot/bbtag/subtags/bot/reason';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ReasonSubtag(),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{reason}',
            expected: '',
            assert(ctx) {
                expect(ctx.scopes.local.reason).to.equal('');
            }
        },
        {
            code: '{reason;}',
            expected: '',
            assert(ctx) {
                expect(ctx.scopes.local.reason).to.equal('');
            }
        },
        {
            code: '{reason;Because i can}',
            expected: '',
            assert(ctx) {
                expect(ctx.scopes.local.reason).to.equal('Because i can');
            }
        }
    ]
});
