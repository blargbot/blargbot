import { Subtag } from '@blargbot/bbtag';
import { EveryoneMentionSubtag } from '@blargbot/bbtag/subtags/message/everyoneMention.js';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(EveryoneMentionSubtag),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{everyonemention}',
            expected: '@everyone',
            assert(ctx) {
                chai.expect(ctx.data.allowedMentions.everybody).to.be.true;
            }
        },
        {
            code: '{everyonemention;true}',
            expected: '@everyone',
            assert(ctx) {
                chai.expect(ctx.data.allowedMentions.everybody).to.be.true;
            }
        },
        {
            code: '{everyonemention;false}',
            expected: '@everyone',
            assert(ctx) {
                chai.expect(ctx.data.allowedMentions.everybody).to.be.false;
            }
        }
    ]
});
