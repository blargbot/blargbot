import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { RandStrSubtag } from '@cluster/subtags/misc/randstr';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new RandStrSubtag(),
    cases: [
        {
            code: '{randstr}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 9, error: new NotEnoughArgumentsError(2, 0) }
            ]
        },
        {
            code: '{randstr;{eval}}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 0, end: 16, error: new NotEnoughArgumentsError(2, 1) }
            ]
        },
        { code: '{randstr;abcdefg;5}', expected: /^([a-g])(?!\1{4})[a-g]{4}$/, retries: 5 },
        { code: '{randstr;123abc456xyz;7}', expected: /^([abcxyz1-6])(?!\1{6})[abcxyz1-6]{6}$/, retries: 5 },
        {
            code: '{randstr;{eval};{eval};{eval}}',
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
