import { Subtag } from '@blargbot/bbtag';
import { NsfwSubtag } from '@blargbot/bbtag/subtags';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(NsfwSubtag),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{nsfw}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.data.nsfw).to.equal('❌ This contains NSFW content! Go to a NSFW channel. ❌');
            }
        },
        {
            code: '{nsfw;}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.data.nsfw).to.equal('❌ This contains NSFW content! Go to a NSFW channel. ❌');
            }
        },
        {
            code: '{nsfw;Buddy you need a bonk}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.data.nsfw).to.equal('Buddy you need a bonk');
            }
        }
    ]
});
