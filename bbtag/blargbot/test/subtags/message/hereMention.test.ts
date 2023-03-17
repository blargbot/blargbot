import { HereMentionSubtag } from '@bbtag/blargbot/subtags';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: HereMentionSubtag,
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{heremention}',
            expected: '@here',
            assert(ctx) {
                chai.expect(ctx.runtime.outputOptions.allowEveryone).to.be.true;
            }
        },
        {
            code: '{heremention;true}',
            expected: '@here',
            assert(ctx) {
                chai.expect(ctx.runtime.outputOptions.allowEveryone).to.be.true;
            }
        },
        {
            code: '{heremention;false}',
            expected: '@here',
            assert(ctx) {
                chai.expect(ctx.runtime.outputOptions.allowEveryone).to.be.false;
            }
        }
    ]
});
