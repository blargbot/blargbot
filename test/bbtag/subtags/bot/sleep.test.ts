import { BBTagRuntimeError } from '@blargbot/bbtag-engine';
import { SleepSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';
import type { sleep as defaultSleep } from '@blargbot/util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const sleep = new Mock<typeof defaultSleep>({ id: 'sleep', callable: true });

await runSubtagTests({
    subtag: new SleepSubtag({
        sleep: sleep.instance
    }),
    argCountBounds: { min: 1, max: 1 },
    names: ['sleep'],
    setup(ctx) {
        ctx.adoptMock(sleep);
    },
    cases: [
        {
            code: '{sleep;100ms}',
            expected: '',
            setup() {
                sleep.setup(m => m(100)).resolves();
            }
        },
        {
            code: '{sleep;50ms}',
            expected: '',
            setup() {
                sleep.setup(m => m(50)).resolves();
            }
        },
        {
            code: '{sleep;1s}',
            expected: '',
            setup() {
                sleep.setup(m => m(1000)).resolves();
            }
        },
        {
            code: '{sleep;1d}',
            expected: '',
            setup() {
                sleep.setup(m => m(300_000)).resolves();
            }
        },
        {
            code: '{sleep;abc}',
            expected: '`Invalid duration`',
            errors: [
                { error: new BBTagRuntimeError('Invalid duration') }
            ]
        }
    ]
});
