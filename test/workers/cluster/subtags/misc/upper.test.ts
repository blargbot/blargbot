import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { UpperSubtag } from '@cluster/subtags/misc/upper';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new UpperSubtag(),
    cases: [
        {
            code: '{upper}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 7, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },

        { code: '{upper;}', expected: '' },
        { code: '{upper;AbC}', expected: 'ABC' },
        { code: '{upper;This Is A Test}', expected: 'THIS IS A TEST' },
        { code: '{upper;ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyz}', expected: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
        {
            code: '{upper;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 7, end: 13, error: new MarkerError('eval', 7) },
                { start: 14, end: 20, error: new MarkerError('eval', 14) },
                { start: 0, end: 21, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
