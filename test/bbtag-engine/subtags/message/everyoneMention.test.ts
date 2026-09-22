import assert from 'node:assert/strict';

import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.everyoneMentionReplacer,
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
