import { NotANumberError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { SpaceSubtag } from '@cluster/subtags/misc/space';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new SpaceSubtag(),
    cases: [
        { code: '{space}', expected: ' ' },
        { code: '{space;}', expected: ' ' },
        { code: '{space;0}', expected: '' },
        { code: '{space;-1}', expected: '' },
        { code: '{space;-5}', expected: '' },
        { code: '{space;7}', expected: '       ' },
        {
            code: '{space;{eval}aaa}',
            expected: '`Not a number`',
            errors: [
                { start: 7, end: 13, error: new MarkerError('eval', 7) },
                { start: 0, end: 17, error: new NotANumberError('aaa') }
            ]
        },
        {
            code: '{space;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 7, end: 13, error: new MarkerError('eval', 7) },
                { start: 14, end: 20, error: new MarkerError('eval', 14) },
                { start: 0, end: 21, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
