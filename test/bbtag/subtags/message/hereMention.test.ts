import assert from 'node:assert/strict';

import { HereMentionSubtag } from '@blargbot/bbtag/subtags/message/hereMention.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new HereMentionSubtag(),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{heremention}',
            expected: '@here',
            assert(ctx) {
                assert.equal(ctx.data.allowedMentions.everybody, true);
            }
        },
        {
            code: '{heremention;true}',
            expected: '@here',
            assert(ctx) {
                assert.equal(ctx.data.allowedMentions.everybody, true);
            }
        },
        {
            code: '{heremention;false}',
            expected: '@here',
            assert(ctx) {
                assert.equal(ctx.data.allowedMentions.everybody, false);
            }
        }
    ]
});
