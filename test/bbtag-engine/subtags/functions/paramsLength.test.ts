import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.paramsLengthReplacer,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{paramslength}',
            expected: '0',
            setup(ctx) { ctx.locals.setup(m => m.functionParameters).returns([]); }
        },
        {
            code: '{paramslength}',
            expected: '4',
            setup(ctx) { ctx.locals.setup(m => m.functionParameters).returns(['this', 'is', 'a', 'test']); }
        },
        {
            code: '{paramslength}',
            expected: '3',
            setup(ctx) { ctx.locals.setup(m => m.functionParameters).returns(['this', 'is a', 'test']); }
        },
        {
            code: '{paramslength}',
            expected: '`{paramslength} can only be used inside {function}`',
            errors: [
                { start: 0, end: 14, error: new BBTagRuntimeError('{paramslength} can only be used inside {function}') }
            ],
            setup(ctx) {
                ctx.locals.setup(m => m.functionParameters).returns(undefined);
            }
        }
    ]
});
