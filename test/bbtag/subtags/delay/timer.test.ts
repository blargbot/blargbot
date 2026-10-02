import type { BBTagSubtag } from '@blargbot/bbtag-engine';
import { InvalidDurationError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.timerReplacer,
    names: ['timer'],
    argCountBounds: { min: { count: 2, noEval: [0] }, max: { count: 2, noEval: [0] } },
    cases: [
        {
            code: '{timer;abc{fail};10s}',
            retries: 3,
            expected: '',
            setup(ctx, code) {
                const scheduledBody = (code.values[0] as BBTagSubtag).args[0];
                ctx.locals.setup(m => m.schedule(ctx.instance, scheduledBody, 10_000)).resolves().mustHappen(1);
            }
        },
        {
            code: '{timer;{fail};test}',
            expected: '`Invalid duration`',
            errors: [
                { start: 0, end: 19, error: new InvalidDurationError('test') }
            ]
        }
    ]
});
