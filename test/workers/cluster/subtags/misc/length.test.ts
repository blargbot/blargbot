import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { EscapeBbtagSubtag } from '@cluster/subtags/misc/escapebbtag';
import { LengthSubtag } from '@cluster/subtags/misc/length';

import { runSubtagTests, TestError } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new LengthSubtag(),
    cases: [
        {
            code: '{length}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 8, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        { code: '{length;}', expected: '0' },
        { code: '{length;abc}', expected: '3' },
        { code: '{length;This is some test text}', expected: '22' },
        { code: '{length;[]}', expected: '0' },
        { code: '{length;{"n":"abc","v":[]}}', expected: '33' },
        { code: '{length;{escapebbtag;{"n":"abc","v":[]}}}', expected: '0', subtags: [new EscapeBbtagSubtag()] },
        { code: '{length;[1,2,3,4]}', expected: '4' },
        { code: '{length;["a","b","cde","f","g"]}', expected: '5' },
        {
            code: '{length;{error};{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 8, end: 15, error: new TestError(8) },
                { start: 16, end: 23, error: new TestError(16) },
                { start: 0, end: 24, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
