import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { TagAuthorSubtag } from '@cluster/subtags/simple/tagauthor';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

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
            code: '{tagauthor;{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 11, end: 17, error: new MarkerError(11) },
                { start: 0, end: 18, error: new TooManyArgumentsError(0, 1) }
            ]
        },
        {
            code: '{ccauthor;{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 10, end: 16, error: new MarkerError(10) },
                { start: 0, end: 17, error: new TooManyArgumentsError(0, 1) }
            ]
        }
    ]
});
