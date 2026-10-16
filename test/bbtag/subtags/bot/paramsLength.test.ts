import { BBTagRuntimeError } from '@blargbot/bbtag';
import { ParamsLengthSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new ParamsLengthSubtag(),
    argCountBounds: { min: 0, max: 0 },
    names: ['paramsLength'],
    cases: [
        {
            code: '{paramslength}',
            expected: '0',
            postSetup(ctx) { ctx.root.paramsarray = []; }
        },
        {
            code: '{paramslength}',
            expected: '4',
            postSetup(ctx) { ctx.root.paramsarray = ['this', 'is', 'a', 'test']; }
        },
        {
            code: '{paramslength}',
            expected: '3',
            postSetup(ctx) { ctx.root.paramsarray = ['this', 'is a', 'test']; }
        },
        {
            code: '{paramslength}',
            expected: '`{paramslength} can only be used inside {function}`',
            errors: [
                { error: new BBTagRuntimeError('{paramslength} can only be used inside {function}') }
            ],
            postSetup(ctx) {
                ctx.root.paramsarray = undefined;
            }
        }
    ]
});
