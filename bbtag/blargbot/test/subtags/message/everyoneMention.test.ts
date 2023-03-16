import { Subtag } from '@bbtag/blargbot';
import { EveryoneMentionSubtag } from '@bbtag/blargbot/subtags';
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
                chai.expect(ctx.runtime.outputOptions.allowEveryone).to.be.true;
            }
        },
        {
            code: '{everyonemention;true}',
            expected: '@everyone',
            assert(ctx) {
                chai.expect(ctx.runtime.outputOptions.allowEveryone).to.be.true;
            }
        },
        {
            code: '{everyonemention;false}',
            expected: '@everyone',
            assert(ctx) {
                chai.expect(ctx.runtime.outputOptions.allowEveryone).to.be.false;
            }
        }
    ]
});
