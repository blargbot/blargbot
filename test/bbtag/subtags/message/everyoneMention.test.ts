import assert from 'node:assert/strict';

import { EveryoneMentionSubtag } from '@blargbot/bbtag/subtags/message/everyoneMention.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new EveryoneMentionSubtag(),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{everyonemention}',
            expected: '@everyone',
            assert(ctx) {
                assert.equal(ctx.data.allowedMentions.everybody, true);
            }
        },
        {
            code: '{everyonemention;true}',
            expected: '@everyone',
            assert(ctx) {
                assert.equal(ctx.data.allowedMentions.everybody, true);
            }
        },
        {
            code: '{everyonemention;false}',
            expected: '@everyone',
            assert(ctx) {
                assert.equal(ctx.data.allowedMentions.everybody, false);
            }
        }
    ]
});
