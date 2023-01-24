import { Subtag } from '@blargbot/bbtag';
import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { ParamsLengthSubtag } from '@blargbot/bbtag/subtags/bot/paramsLength.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ParamsLengthSubtag),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{paramslength}',
            expected: '0',
            setup(ctx) { ctx.rootScope.paramsarray = []; }
        },
        {
            code: '{paramslength}',
            expected: '4',
            setup(ctx) { ctx.rootScope.paramsarray = ['this', 'is', 'a', 'test']; }
        },
        {
            code: '{paramslength}',
            expected: '3',
            setup(ctx) { ctx.rootScope.paramsarray = ['this', 'is a', 'test']; }
        },
        {
            code: '{paramslength}',
            expected: '`{paramslength} can only be used inside {function}`',
            errors: [
                { start: 0, end: 14, error: new BBTagRuntimeError('{paramslength} can only be used inside {function}') }
            ],
            setup(ctx) {
                ctx.rootScope.paramsarray = undefined;
            }
        }
    ]
});
