import assert from 'node:assert/strict';

import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.hereMentionReplacer,
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
