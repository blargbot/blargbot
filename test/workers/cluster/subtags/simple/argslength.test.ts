import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { ArgsLengthSubtag } from '@cluster/subtags/simple/argslength';

import { runSubtagTests, TestError } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ArgsLengthSubtag(),
    cases: [
        {
            code: '{argslength}',
            expected: '0',
            setup(ctx) { ctx.options.inputRaw = ''; }
        },
        {
            code: '{argslength}',
            expected: '4',
            setup(ctx) { ctx.options.inputRaw = 'this is a test'; }
        },
        {
            code: '{argslength}',
            expected: '3',
            setup(ctx) { ctx.options.inputRaw = 'this "is a" test'; }
        },
        {
            code: '{argslength;{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 12, end: 19, error: new TestError(12) },
                { start: 0, end: 20, error: new TooManyArgumentsError(0, 1) }
            ]
        }
    ]
});
