import { HereMentionSubtag } from '@blargbot/bbtag/subtags/message/hereMention.js';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new HereMentionSubtag(),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{heremention}',
            expected: '@here',
            assert(ctx) {
                expect(ctx.data.allowedMentions.everybody).to.be.true;
            }
        },
        {
            code: '{heremention;true}',
            expected: '@here',
            assert(ctx) {
                expect(ctx.data.allowedMentions.everybody).to.be.true;
            }
        },
        {
            code: '{heremention;false}',
            expected: '@here',
            assert(ctx) {
                expect(ctx.data.allowedMentions.everybody).to.be.false;
            }
        }
    ]
});
