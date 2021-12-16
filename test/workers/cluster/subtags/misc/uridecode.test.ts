import { BBTagRuntimeError, NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { UriDecodeSubtag } from '@cluster/subtags/misc/uridecode';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new UriDecodeSubtag(),
    cases: [
        {
            code: '{uridecode}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 11, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        { code: '{uridecode;JavaScript_%D1%88%D0%B5%D0%BB%D0%BB%D1%8B}', expected: 'JavaScript_шеллы' },
        { code: '{uridecode;search+query%20%28correct%29}', expected: 'search+query (correct)' },
        {
            code: '{uridecode;%E0%A4%A}',
            expected: '`URI malformed`',
            errors: [
                { start: 0, end: 20, error: new BBTagRuntimeError('URI malformed') }
            ]
        },
        {
            code: '{uridecode;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 11, end: 17, error: new MarkerError('eval', 11) },
                { start: 18, end: 24, error: new MarkerError('eval', 18) },
                { start: 0, end: 25, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
