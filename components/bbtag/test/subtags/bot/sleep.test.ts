import { BBTagRuntimeError, Subtag  } from '@blargbot/bbtag';
import { SleepSubtag } from '@blargbot/bbtag/subtags';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(SleepSubtag),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{sleep;100ms}',
            expected: '',
            retries: 5,
            assert(_, __, ctx) {
                chai.expect(ctx.timer.elapsed).to.be.closeTo(100, 10);
            }
        },
        {
            code: '{sleep;50ms}',
            expected: '',
            retries: 5,
            assert(_, __, ctx) {
                chai.expect(ctx.timer.elapsed).to.be.closeTo(50, 2);
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
