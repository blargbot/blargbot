import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { ArgsArraySubtag } from '@cluster/subtags/simple/argsarray';

import { runSubtagTests, TestError } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ArgsArraySubtag(),
    cases: [
        {
            code: '{argsarray}',
            expected: '[]',
            setup(ctx) { ctx.options.inputRaw = ''; }
        },
        {
            code: '{argsarray}',
            expected: '["this","is","a","test"]',
            setup(ctx) { ctx.options.inputRaw = 'this is a test'; }
        },
        {
            code: '{argsarray}',
            expected: '["this","is a","test"]',
            setup(ctx) { ctx.options.inputRaw = 'this "is a" test'; }
        },
        {
            code: '{argsarray;{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 11, end: 18, error: new TestError(11) },
                { start: 0, end: 19, error: new TooManyArgumentsError(0, 1) }
            ]
        }
    ]
});
