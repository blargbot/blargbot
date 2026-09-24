import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.paramsArrayReplacer,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{paramsarray}',
            expected: '[]',
            setup(ctx) { ctx.locals.setup(m => m.functionParameters).returns([]); }
        },
        {
            code: '{paramsarray}',
            expected: '["this","is","a","test"]',
            setup(ctx) { ctx.locals.setup(m => m.functionParameters).returns(['this', 'is', 'a', 'test']); }
        },
        {
            code: '{paramsarray}',
            expected: '["this","is a","test"]',
            setup(ctx) { ctx.locals.setup(m => m.functionParameters).returns(['this', 'is a', 'test']); }
        },
        {
            code: '{paramsarray}',
            expected: '`{paramsarray} can only be used inside {function}`',
            errors: [
                { start: 0, end: 13, error: new BBTagRuntimeError('{paramsarray} can only be used inside {function}') }
            ],
            setup(ctx) {
                ctx.locals.setup(m => m.functionParameters).returns(undefined);
            }
        }
    ]
});
