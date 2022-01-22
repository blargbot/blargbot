import { NotANumberError, NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { RoundSubtag } from '@cluster/subtags/math/round';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new RoundSubtag(),
    cases: [
        {
            code: '{round}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 7, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        { code: '{round;5}', expected: '5' },
        { code: '{round;9.2}', expected: '9' },
        { code: '{round;3.6}', expected: '4' },
        { code: '{round;4.5}', expected: '5' },
        { code: '{round;22.499999}', expected: '22' },
        {
            code: '{round;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 11, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{round;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 7, end: 13, error: new MarkerError('eval', 7) },
                { start: 14, end: 20, error: new MarkerError('eval', 14) },
                { start: 0, end: 21, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
