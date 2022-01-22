import { NotANumberError, NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { RoundUpSubtag } from '@cluster/subtags/math/roundup';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new RoundUpSubtag(),
    cases: [
        {
            code: '{roundup}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 9, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        { code: '{roundup;5}', expected: '5' },
        { code: '{roundup;9.2}', expected: '10' },
        { code: '{roundup;3.6}', expected: '4' },
        { code: '{roundup;4.5}', expected: '5' },
        { code: '{roundup;22.499999}', expected: '23' },
        {
            code: '{roundup;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 13, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{roundup;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 16, end: 22, error: new MarkerError('eval', 16) },
                { start: 0, end: 23, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
