import { Subtag } from '@blargbot/bbtag';
import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { TimerSubtag } from '@blargbot/bbtag/subtags/bot/timer.js';
import { argument } from '@blargbot/test-util/mock.js';
import moment from 'moment-timezone';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(TimerSubtag),
    argCountBounds: { min: { count: 2, noEval: [0] }, max: { count: 2, noEval: [0] } },
    cases: [
        {
            code: '{timer;abc{fail};10s}',
            retries: 3,
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.setTimeout(bbctx, 'abc{fail}', argument.isDeepEqual(moment.duration(10, 's')))).thenResolve(undefined);
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
