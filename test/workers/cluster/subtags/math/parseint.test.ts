import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { ParseIntSubtag } from '@cluster/subtags/math/parseint';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ParseIntSubtag(),
    cases: [
        {
            code: '{parseint}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 10, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        { code: '{parseint;123}', expected: '123' },
        { code: '{parseint;123.456}', expected: '123' },
        { code: '{parseint;123,456}', expected: '123' },
        { code: '{parseint;abc}', expected: 'NaN' },
        { code: '{parseint;123,456.789}', expected: '123456' },
        { code: '{parseint;123.456,789}', expected: '123456' },
        {
            code: '{parseint;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 10, end: 16, error: new MarkerError('eval', 10) },
                { start: 17, end: 23, error: new MarkerError('eval', 17) },
                { start: 0, end: 24, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
