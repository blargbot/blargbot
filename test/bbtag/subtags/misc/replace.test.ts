import assert from 'node:assert/strict';

import { ReplaceSubtag } from '@blargbot/bbtag-engine/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new ReplaceSubtag(),
    argCountBounds: { min: 2, max: 3 },
    names: ['replace'],
    cases: [
        {
            code: '{replace;abc;123}',
            expected: '',
            async assert(ctx) {
                const result = await ctx.bbtag.root.output.replace?.('|abc,abc,def|');
                assert.equal(result, '|123,abc,def|');
            }
        },
        { code: '{replace;This is a test;is;aaaa}', expected: 'Thaaaa is a test' }
    ]
});
