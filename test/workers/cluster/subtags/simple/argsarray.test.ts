import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { ArgsArraySubtag } from '@cluster/subtags/simple/argsarray';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

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
            code: '{argsarray;{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 11, end: 17, error: new MarkerError(11) },
                { start: 0, end: 18, error: new TooManyArgumentsError(0, 1) }
            ]
        }
    ]
});
