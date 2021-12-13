import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { TagAuthorSubtag } from '@cluster/subtags/simple/tagauthor';

import { runSubtagTests, TestError } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new TagAuthorSubtag(),
    cases: [
        {
            code: '{tagauthor}',
            expected: '1234567',
            setup(ctx) { ctx.options.author = '1234567'; }
        },
        {
            code: '{ccauthor}',
            expected: 'abcdefg',
            setup(ctx) { ctx.options.author = 'abcdefg'; }
        },
        {
            code: '{tagauthor;{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 11, end: 18, error: new TestError(11) },
                { start: 0, end: 19, error: new TooManyArgumentsError(0, 1) }
            ]
        },
        {
            code: '{ccauthor;{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 10, end: 17, error: new TestError(10) },
                { start: 0, end: 18, error: new TooManyArgumentsError(0, 1) }
            ]
        }
    ]
});
