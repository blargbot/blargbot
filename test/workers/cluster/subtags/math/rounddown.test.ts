import { NotANumberError, NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { RoundDownSubtag } from '@cluster/subtags/math/rounddown';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new RoundDownSubtag(),
    cases: [
        {
            code: '{rounddown}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 11, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        { code: '{rounddown;5}', expected: '5' },
        { code: '{rounddown;9.2}', expected: '9' },
        { code: '{rounddown;3.6}', expected: '3' },
        { code: '{rounddown;4.5}', expected: '4' },
        { code: '{rounddown;22.499999}', expected: '22' },
        {
            code: '{rounddown;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 15, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{rounddown;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 11, end: 17, error: new MarkerError('eval', 11) },
                { start: 18, end: 24, error: new MarkerError('eval', 18) },
                { start: 0, end: 25, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
