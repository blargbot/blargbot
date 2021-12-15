import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { TagAuthorizerSubtag } from '@cluster/subtags/simple/tagauthorizer';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new TagAuthorizerSubtag(),
    cases: [
        {
            code: '{tagauthorizer}',
            expected: '1234567',
            setup(ctx) { ctx.options.author = '1234567'; }
        },
        {
            code: '{ccauthorizer}',
            expected: 'abcdefg',
            setup(ctx) { ctx.options.author = 'abcdefg'; }
        },
        {
            code: '{tagauthorizer;{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 15, end: 21, error: new MarkerError('eval', 15) },
                { start: 0, end: 22, error: new TooManyArgumentsError(0, 1) }
            ]
        },
        {
            code: '{ccauthorizer;{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 14, end: 20, error: new MarkerError('eval', 14) },
                { start: 0, end: 21, error: new TooManyArgumentsError(0, 1) }
            ]
        }
    ]
});
