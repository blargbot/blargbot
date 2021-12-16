import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { UnindentSubtag } from '@cluster/subtags/misc/unindent';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new UnindentSubtag(),
    cases: [
        {
            code: '{unindent}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 10, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        { code: '{unindent;this is a test:\n    1. abc\n      a. 123\n    2. xyz\n    3. aaaa}', expected: 'this is a test:\n1. abc\n  a. 123\n2. xyz\n3. aaaa' },
        { code: '{unindent;this is a test:\n    1. abc\n      a. 123\n    2. xyz\n    3. aaaa;2}', expected: 'this is a test:\n  1. abc\n    a. 123\n  2. xyz\n  3. aaaa' },
        { code: '{unindent;this is a test:\n    1. abc\n      a. 123\n    2. xyz\n    3. aaaa;xyz}', expected: 'this is a test:\n1. abc\n  a. 123\n2. xyz\n3. aaaa' },
        { code: '{unindent;hello!}', expected: 'hello!' },
        { code: '{unindent;hello!;2}', expected: 'hello!' },
        {
            code: '{unindent;{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 10, end: 16, error: new MarkerError('eval', 10) },
                { start: 17, end: 23, error: new MarkerError('eval', 17) },
                { start: 24, end: 30, error: new MarkerError('eval', 24) },
                { start: 0, end: 31, error: new TooManyArgumentsError(2, 3) }
            ]
        }
    ]
});
