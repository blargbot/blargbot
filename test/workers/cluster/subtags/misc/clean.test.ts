import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { CleanSubtag } from '@cluster/subtags/misc/clean';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

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
        { code: '{clean;Hello!  \n\n\t\t  Im     here    to help}', expected: 'Hello!\nIm here to help' },
        { code: '{clean;Hello!  \n\n-\t\t  Im     here    to help}', expected: 'Hello!\n-\tIm here to help' },
        {
            code: '{clean;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 7, end: 13, error: new MarkerError('eval', 7) },
                { start: 14, end: 20, error: new MarkerError('eval', 14) },
                { start: 0, end: 21, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
