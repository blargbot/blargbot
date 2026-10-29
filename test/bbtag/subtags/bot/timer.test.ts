import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { ScheduleFeature } from '@blargbot/bbtag/subtags';
import { TimerSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<ScheduleFeature>({ id: 'features' });
const now = Temporal.Instant.from('2026-09-22T22:20:00Z');

await runSubtagTests({
    subtag: new TimerSubtag(features.instance),
    argCountBounds: { min: { count: 2, noEval: [0] }, max: { count: 2, noEval: [0] } },
    names: ['timer'],
    setup(ctx, _, test) {
        ctx.adoptMock(features);
        test.mock.method(Temporal.Now, 'instant', () => now);
    },
    cases: [
        {
            code: '{timer;abc{fail};10s}',
            expected: '',
            setup(ctx) {
                const target = now.add({ seconds: 10 });
                features.setup((m, $) => m.scheduleBBTag(ctx.bbtag, 'abc{fail}', $(target))).resolves().mustHappen(1);
            }
        },
        {
            code: '{timer;{fail};test}',
            expected: '`Invalid duration`',
            errors: [
                { error: new BBTagRuntimeError('Invalid duration') }
            ]
        }
    ]
});
