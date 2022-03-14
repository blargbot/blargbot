import { BBTagRuntimeError } from '@blargbot/cluster/bbtag/errors';
import { ParamsLengthSubtag } from '@blargbot/cluster/subtags/bot/paramslength';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ParamsLengthSubtag(),
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
