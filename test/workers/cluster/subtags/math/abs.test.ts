import { NotANumberError, NotEnoughArgumentsError } from '@cluster/bbtag/errors';
import { AbsSubtag } from '@cluster/subtags/math/abs';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new AbsSubtag(),
    cases: [
        {
            code: '{abs}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 5, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        { code: '{abs;12345}', expected: '12345' },
        { code: '{abs;-9876}', expected: '9876' },
        { code: '{abs;012345}', expected: '12345' },
        { code: '{abs;-09876}', expected: '9876' },
        { code: '{abs;[0,1,-1,10,-20]}', expected: '[0,1,1,10,20]' },
        { code: '{abs;[-7]}', expected: '7' },
        { code: '{abs;[-8,"-7"];5;-3}', expected: '[8,7,5,3]' },
        {
            code: '{abs;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 9, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{abs;[1,2,"def"]}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 17, error: new NotANumberError('def') }
            ]
        }
    ]
});
