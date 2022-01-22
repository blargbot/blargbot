import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { ParseFloatSubtag } from '@cluster/subtags/math/parsefloat';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ParseFloatSubtag(),
    cases: [
        {
            code: '{parsefloat}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 12, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        { code: '{parsefloat;123}', expected: '123' },
        { code: '{parsefloat;123.456}', expected: '123.456' },
        { code: '{parsefloat;123,456}', expected: '123.456' },
        { code: '{parsefloat;abc}', expected: 'NaN' },
        { code: '{parsefloat;123,456.789}', expected: '123456.789' },
        { code: '{parsefloat;123.456,789}', expected: '123456.789' },
        {
            code: '{parsefloat;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 12, end: 18, error: new MarkerError('eval', 12) },
                { start: 19, end: 25, error: new MarkerError('eval', 19) },
                { start: 0, end: 26, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
