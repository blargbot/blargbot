import { BBTagRuntimeError } from '@blargbot/bbtag-engine';
import { ParamsArraySubtag } from '@blargbot/bbtag-engine/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new ParamsArraySubtag(),
    argCountBounds: { min: 0, max: 0 },
    names: ['paramsArray'],
    cases: [
        {
            code: '{paramsarray}',
            expected: '[]',
            setup(ctx) { ctx.bbtag.root.paramsarray = []; }
        },
        {
            code: '{paramsarray}',
            expected: '["this","is","a","test"]',
            setup(ctx) { ctx.bbtag.root.paramsarray = ['this', 'is', 'a', 'test']; }
        },
        {
            code: '{paramsarray}',
            expected: '["this","is a","test"]',
            setup(ctx) { ctx.bbtag.root.paramsarray = ['this', 'is a', 'test']; }
        },
        {
            code: '{paramsarray}',
            expected: '`{paramsarray} can only be used inside {function}`',
            errors: [
                { error: new BBTagRuntimeError('{paramsarray} can only be used inside {function}') }
            ],
            setup(ctx) {
                ctx.bbtag.root.paramsarray = undefined;
            }
        }
    ]
});
