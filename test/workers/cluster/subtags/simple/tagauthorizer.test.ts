import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { TagAuthorizerSubtag } from '@cluster/subtags/simple/tagauthorizer';

import { runSubtagTests, TestError } from '../SubtagTestSuite';

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
            code: '{tagauthorizer;{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 15, end: 22, error: new TestError(15) },
                { start: 0, end: 23, error: new TooManyArgumentsError(0, 1) }
            ]
        },
        {
            code: '{ccauthorizer;{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 14, end: 21, error: new TestError(14) },
                { start: 0, end: 22, error: new TooManyArgumentsError(0, 1) }
            ]
        }
    ]
});
