import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { LowerSubtag } from '@cluster/subtags/misc/lower';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new LowerSubtag(),
    cases: [
        {
            code: '{lower}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 7, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        { code: '{lower;}', expected: '' },
        { code: '{lower;AbC}', expected: 'abc' },
        { code: '{lower;This Is A Test}', expected: 'this is a test' },
        { code: '{lower;ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyz}', expected: 'abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz' },
        {
            code: '{lower;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 7, end: 13, error: new MarkerError('eval', 7) },
                { start: 14, end: 20, error: new MarkerError('eval', 14) },
                { start: 0, end: 21, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
