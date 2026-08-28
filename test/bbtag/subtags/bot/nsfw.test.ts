import assert from 'node:assert/strict';

import { NsfwSubtag } from '@blargbot/bbtag/subtags/bot/nsfw.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new NsfwSubtag(),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{nsfw}',
            expected: '',
            assert(ctx) {
                assert.equal(ctx.data.nsfw, '❌ This contains NSFW content! Go to a NSFW channel. ❌');
            }
        },
        {
            code: '{nsfw;}',
            expected: '',
            assert(ctx) {
                assert.equal(ctx.data.nsfw, '❌ This contains NSFW content! Go to a NSFW channel. ❌');
            }
        },
        {
            code: '{nsfw;Buddy you need a bonk}',
            expected: '',
            assert(ctx) {
                assert.equal(ctx.data.nsfw, 'Buddy you need a bonk');
            }
        }
    ]
});
