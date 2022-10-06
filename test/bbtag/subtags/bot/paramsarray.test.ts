import { BBTagRuntimeError } from '@blargbot/bbtag/errors';
import { ParamsArraySubtag } from '@blargbot/bbtag/subtags/bot/paramsarray';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ParamsArraySubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: `{paramsarray}`,
            expected: `[]`,
            setup(ctx) { ctx.rootScope.paramsarray = []; }
        },
        {
            code: `{paramsarray}`,
            expected: `["this","is","a","test"]`,
            setup(ctx) { ctx.rootScope.paramsarray = [`this`, `is`, `a`, `test`]; }
        },
        {
            code: `{paramsarray}`,
            expected: `["this","is a","test"]`,
            setup(ctx) { ctx.rootScope.paramsarray = [`this`, `is a`, `test`]; }
        },
        {
            code: `{paramsarray}`,
            expected: `\`{paramsarray} can only be used inside {function}\``,
            errors: [
                { start: 0, end: 13, error: new BBTagRuntimeError(`{paramsarray} can only be used inside {function}`) }
            ],
            setup(ctx) {
                ctx.rootScope.paramsarray = undefined;
            }
        }
    ]
});
