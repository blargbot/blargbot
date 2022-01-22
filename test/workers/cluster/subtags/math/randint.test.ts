import { NotANumberError, NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { RandIntSubtag } from '@cluster/subtags/math/randint';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new RandIntSubtag(),
    cases: [
        {
            code: '{randint}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 9, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        { code: '{randint;9}', expected: /^[0-9]$/ },
        { code: '{randint;4}', expected: /^[0-4]$/ },
        { code: '{randint;1030}', expected: /^1?[0-9]{1,3}$/ },
        { code: '{randint;1;9}', expected: /^[1-9]$/ },
        { code: '{randint;3;4}', expected: /^[3-4]$/ },
        { code: '{randint;1030;1030}', expected: '1030' },
        {
            code: '{randint;abc;1030}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 18, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{randint;6;def}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 15, error: new NotANumberError('def') }
            ]
        },
        {
            code: '{randint;{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 16, end: 22, error: new MarkerError('eval', 16) },
                { start: 23, end: 29, error: new MarkerError('eval', 23) },
                { start: 0, end: 30, error: new TooManyArgumentsError(2, 3) }
            ]
        }
    ]
});
