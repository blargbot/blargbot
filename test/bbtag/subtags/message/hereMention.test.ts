import assert from 'node:assert/strict';

import { HereMentionSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new HereMentionSubtag(),
    argCountBounds: { min: 0, max: 1 },
    names: ['here', 'hereMention'],
    cases: [
        {
            code: '{heremention}',
            expected: '@here',
            assert(ctx) {
                assert.equal(ctx.root.allowedMentions.everybody, true);
            }
        },
        {
            code: '{heremention;true}',
            expected: '@here',
            assert(ctx) {
                assert.equal(ctx.root.allowedMentions.everybody, true);
            }
        },
        {
            code: '{heremention;false}',
            expected: '@here',
            assert(ctx) {
                assert.equal(ctx.root.allowedMentions.everybody, false);
            }
        }
    ]
});
