import { BBTagRuntimeError } from '@blargbot/bbtag';
import { TimerSubtag } from '@blargbot/bbtag/subtags';
import moment from 'moment-timezone';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new TimerSubtag(),
    argCountBounds: { min: { count: 2, noEval: [0] }, max: { count: 2, noEval: [0] } },
    names: ['timer'],
    cases: [
        {
            code: '{timer;abc{fail};10s}',
            retries: 3,
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.util.setup((m, $) => m.setTimeout(bbctx, 'abc{fail}', $(moment.duration(10, 's')))).resolves(undefined);
            }
        },
        {
            code: '{timer;{fail};test}',
            expected: '`Invalid duration`',
            errors: [
                { start: 0, end: 19, error: new BBTagRuntimeError('Invalid duration') }
            ]
        }
    ]
});
