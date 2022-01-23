import { HereMentionSubtag } from '@cluster/subtags/message/heremention';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new HereMentionSubtag(),
    cases: [
        {
            code: '{heremention}',
            expected: '@here',
            assert(ctx) {
                expect(ctx.state.allowedMentions.everybody).to.be.true;
            }
        },
        {
            code: '{heremention;true}',
            expected: '@here',
            assert(ctx) {
                expect(ctx.state.allowedMentions.everybody).to.be.true;
            }
        },
        {
            code: '{heremention;false}',
            expected: '@here',
            assert(ctx) {
                expect(ctx.state.allowedMentions.everybody).to.be.false;
            }
        }
    ]
});
