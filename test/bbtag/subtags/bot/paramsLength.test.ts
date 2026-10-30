import { BBTagRuntimeError } from '@blargbot/bbtag-engine';
import { ParamsLengthSubtag } from '@blargbot/bbtag-engine/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new ParamsLengthSubtag(),
    argCountBounds: { min: 0, max: 0 },
    names: ['paramsLength'],
    cases: [
        {
            code: '{paramslength}',
            expected: '0',
            setup(ctx) { ctx.bbtag.root.paramsarray = []; }
        },
        {
            code: '{paramslength}',
            expected: '4',
            setup(ctx) { ctx.bbtag.root.paramsarray = ['this', 'is', 'a', 'test']; }
        },
        {
            code: '{paramslength}',
            expected: '3',
            setup(ctx) { ctx.bbtag.root.paramsarray = ['this', 'is a', 'test']; }
        },
        {
            code: '{paramslength}',
            expected: '`{paramslength} can only be used inside {function}`',
            errors: [
                { error: new BBTagRuntimeError('{paramslength} can only be used inside {function}') }
            ],
            setup(ctx) {
                ctx.bbtag.root.paramsarray = undefined;
            }
        }
    ]
});
