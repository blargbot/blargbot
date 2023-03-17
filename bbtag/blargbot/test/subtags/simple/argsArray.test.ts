import { ArgsArraySubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: ArgsArraySubtag,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{argsarray}',
            expected: '[]',
            setup(ctx) { ctx.entrypoint.inputRaw = ''; }
        },
        {
            code: '{argsarray}',
            expected: '["this","is","a","test"]',
            setup(ctx) { ctx.entrypoint.inputRaw = 'this is a test'; }
        },
        {
            code: '{argsarray}',
            expected: '["this","is a","test"]',
            setup(ctx) { ctx.entrypoint.inputRaw = 'this "is a" test'; }
        }
    ]
});
