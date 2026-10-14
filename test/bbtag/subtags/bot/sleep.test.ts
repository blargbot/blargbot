import { BBTagRuntimeError } from '@blargbot/bbtag';
import { SleepSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';
import type { sleep as defaultSleep } from '@blargbot/util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const sleep = new Mock<typeof defaultSleep>({ callable: true });

await runSubtagTests({
    subtag: new SleepSubtag({
        sleep: sleep.instance
    }),
    argCountBounds: { min: 1, max: 1 },
    names: ['sleep'],
    setup(ctx) {
        ctx.addMock(sleep);
    },
    cases: [
        {
            code: '{sleep;100ms}',
            expected: '',
            retries: 5,
            setup() {
                sleep.setup(m => m(100)).resolves();
            }
        },
        {
            code: '{sleep;50ms}',
            expected: '',
            retries: 5,
            setup() {
                sleep.setup(m => m(50)).resolves();
            }
        },
        {
            code: '{sleep;1s}',
            expected: '',
            retries: 5,
            setup() {
                sleep.setup(m => m(1000)).resolves();
            }
        },
        {
            code: '{sleep;1d}',
            expected: '',
            retries: 5,
            setup() {
                sleep.setup(m => m(300_000)).resolves();
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
