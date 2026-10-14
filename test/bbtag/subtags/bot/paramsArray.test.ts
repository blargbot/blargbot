import { BBTagRuntimeError } from '@blargbot/bbtag';
import { ParamsArraySubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new ParamsArraySubtag(),
    argCountBounds: { min: 0, max: 0 },
    names: ['paramsArray'],
    cases: [
        {
            code: '{paramsarray}',
            expected: '[]',
            postSetup(ctx) { ctx.root.paramsarray = []; }
        },
        {
            code: '{paramsarray}',
            expected: '["this","is","a","test"]',
            postSetup(ctx) { ctx.root.paramsarray = ['this', 'is', 'a', 'test']; }
        },
        {
            code: '{paramsarray}',
            expected: '["this","is a","test"]',
            postSetup(ctx) { ctx.root.paramsarray = ['this', 'is a', 'test']; }
        },
        {
            code: '{paramsarray}',
            expected: '`{paramsarray} can only be used inside {function}`',
            errors: [
                { start: 0, end: 13, error: new BBTagRuntimeError('{paramsarray} can only be used inside {function}') }
            ],
            postSetup(ctx) {
                ctx.root.paramsarray = undefined;
            }
        }
    ]
});
