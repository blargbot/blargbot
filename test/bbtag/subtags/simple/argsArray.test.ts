import { ArgsArraySubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new ArgsArraySubtag(),
    argCountBounds: { min: 0, max: 0 },
    names: ['argsArray'],
    cases: [
        {
            code: '{argsarray}',
            expected: '[]',
            setup(ctx) { ctx.input.array = []; }
        },
        {
            code: '{argsarray}',
            expected: '["this","is","a","test"]',
            setup(ctx) { ctx.input.array = ['this', 'is', 'a', 'test']; }
        },
        {
            code: '{argsarray}',
            expected: '["this","is a","test"]',
            setup(ctx) { ctx.input.array = ['this', 'is a', 'test']; }
        }
    ]
});
