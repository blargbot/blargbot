import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { IsCCSubtag } from '@cluster/subtags/simple/iscc';

import { runSubtagTests, TestError } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new IsCCSubtag(),
    cases: [
        {
            code: '{iscc}',
            expected: 'true',
            setup(ctx) { ctx.options.isCC = true; }
        },
        {
            code: '{iscc}',
            expected: 'false',
            setup(ctx) { ctx.options.isCC = false; }
        },
        {
            code: '{iscc;{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 6, end: 13, error: new TestError(6) },
                { start: 0, end: 14, error: new TooManyArgumentsError(0, 1) }
            ]
        }
    ]
});
