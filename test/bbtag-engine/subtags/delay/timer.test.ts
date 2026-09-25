import type { BBTagSubtag } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.timerReplacer,
    argCountBounds: { min: { count: 2, noEval: [0] }, max: { count: 2, noEval: [0] } },
    cases: [
        {
            code: '{timer;abc{fail};10s}',
            retries: 3,
            expected: '',
            postSetup(bbctx, ctx, code) {
                const scheduledBody = (code.values[0] as BBTagSubtag).args[1];
                ctx.locals.setup((m, $) => m.schedule(bbctx, $(scheduledBody), 10_000)).resolves().mustHappen(1);
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
