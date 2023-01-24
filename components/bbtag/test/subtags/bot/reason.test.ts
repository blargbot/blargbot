import { Subtag } from '@blargbot/bbtag';
import { ReasonSubtag } from '@blargbot/bbtag/subtags/bot/reason.js';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ReasonSubtag),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{reason}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.scopes.local.reason).to.equal('');
            }
        },
        {
            code: '{reason;}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.scopes.local.reason).to.equal('');
            }
        },
        {
            code: '{reason;Because i can}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.scopes.local.reason).to.equal('Because i can');
            }
        }
    ]
});
