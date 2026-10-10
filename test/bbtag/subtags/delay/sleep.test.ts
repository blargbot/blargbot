import { InvalidDurationError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.sleepReplacer,
    names: ['sleep'],
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{sleep;100ms}',
            expected: '',
            retries: 5,
            setup(ctx) {
                ctx.locals.setup(m => m.sleep(100)).resolves().mustHappen(1);
            }
        },
        {
            code: '{sleep;50ms}',
            expected: '',
            retries: 5,
            setup(ctx) {
                ctx.locals.setup(m => m.sleep(50)).resolves().mustHappen(1);
            }
        },
        {
            code: '{sleep;1s}',
            expected: '',
            retries: 5,
            setup(ctx) {
                ctx.locals.setup(m => m.sleep(1000)).resolves().mustHappen(1);
            }
        },
        {
            code: '{sleep;1d}',
            expected: '',
            retries: 5,
            setup(ctx) {
                ctx.locals.setup(m => m.sleep(5 * 60_000)).resolves().mustHappen(1);
            }
        },
        {
            code: '{sleep;abc}',
            expected: '`Invalid duration`',
            errors: [
                { start: 0, end: 11, error: new InvalidDurationError('abc') }
            ]
        }
    ]
});
