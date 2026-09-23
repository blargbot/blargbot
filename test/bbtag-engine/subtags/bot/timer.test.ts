import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';
import { $ } from '@blargbot/test-util';
import moment from 'moment-timezone';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.timerReplacer,
    argCountBounds: { min: { count: 2, noEval: [0] }, max: { count: 2, noEval: [0] } },
    cases: [
        {
            code: '{timer;abc{fail};10s}',
            retries: 3,
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.setTimeout(bbctx, 'abc{fail}', $.looksLike(moment.duration(10, 's')))).thenResolve(undefined);
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
