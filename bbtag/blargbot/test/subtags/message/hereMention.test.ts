import { Subtag } from '@bbtag/blargbot';
import { HereMentionSubtag } from '@bbtag/blargbot/subtags';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(HereMentionSubtag),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{heremention}',
            expected: '@here',
            assert(ctx) {
                chai.expect(ctx.data.allowedMentions.everybody).to.be.true;
            }
        },
        {
            code: '{heremention;true}',
            expected: '@here',
            assert(ctx) {
                chai.expect(ctx.data.allowedMentions.everybody).to.be.true;
            }
        },
        {
            code: '{heremention;false}',
            expected: '@here',
            assert(ctx) {
                chai.expect(ctx.data.allowedMentions.everybody).to.be.false;
            }
        }
    ]
});
