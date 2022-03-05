import { NsfwSubtag } from '@cluster/subtags/bot/nsfw';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new NsfwSubtag(),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{nsfw}',
            expected: '',
            assert(ctx) {
                expect(ctx.state.nsfw).to.equal('❌ This contains NSFW content! Go to a NSFW channel. ❌');
            }
        },
        {
            code: '{nsfw;}',
            expected: '',
            assert(ctx) {
                expect(ctx.state.nsfw).to.equal('❌ This contains NSFW content! Go to a NSFW channel. ❌');
            }
        },
        {
            code: '{nsfw;Buddy you need a bonk}',
            expected: '',
            assert(ctx) {
                expect(ctx.state.nsfw).to.equal('Buddy you need a bonk');
            }
        }
    ]
});
