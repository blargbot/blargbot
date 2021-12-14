import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { CleanSubtag } from '@cluster/subtags/misc/clean';

import { runSubtagTests, TestError } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new CleanSubtag(),
    cases: [
        {
            code: '{clean}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 7, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        { code: '{clean;Hello!  \n\n  Im     here    to help}', expected: 'Hello!\nIm here to help' },
        {
            code: '{clean;{error};{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 7, end: 14, error: new TestError(7) },
                { start: 15, end: 22, error: new TestError(15) },
                { start: 23, end: 24, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
