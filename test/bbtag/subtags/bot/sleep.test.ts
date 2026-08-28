import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { SleepSubtag } from '@blargbot/bbtag/subtags/bot/sleep.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new SleepSubtag(),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{sleep;100ms}',
            expected: '',
            retries: 5,
            setup(ctx) {
                ctx.sleep.setup(m => m.sleep(100)).thenResolve();
            }
        },
        {
            code: '{sleep;50ms}',
            expected: '',
            retries: 5,
            setup(ctx) {
                ctx.sleep.setup(m => m.sleep(50)).thenResolve();
            }
        },
        {
            code: '{sleep;1s}',
            expected: '',
            retries: 5,
            setup(ctx) {
                ctx.sleep.setup(m => m.sleep(1000)).thenResolve();
            }
        },
        {
            code: '{sleep;1d}',
            expected: '',
            retries: 5,
            setup(ctx) {
                ctx.sleep.setup(m => m.sleep(300_000)).thenResolve();
            }
        },
        {
            code: '{sleep;abc}',
            expected: '`Invalid duration`',
            errors: [
                { start: 0, end: 11, error: new BBTagRuntimeError('Invalid duration') }
            ]
        }
    ]
});
