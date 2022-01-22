import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { NumFormatSubtag } from '@cluster/subtags/math/numformat';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new NumFormatSubtag(),
    cases: [
        {
            code: '{numformat}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 11, error: new NotEnoughArgumentsError(2, 0) }
            ]
        },
        {
            code: '{numformat;{eval}}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 11, end: 17, error: new MarkerError('eval', 11) },
                { start: 0, end: 18, error: new NotEnoughArgumentsError(2, 1) }
            ]
        },
        { code: '{numformat;123456.789;2}', expected: '123456.79' },
        { code: '{numformat;123456.789;-3}', expected: '123000' },
        { code: '{numformat;100.10000;}', expected: '100.1' },
        { code: '{numformat;3.1415;4;,}', expected: '3,1415' },
        { code: '{numformat;100000;;;.}', expected: '100.000' },
        { code: '{numformat;abc;2}', expected: 'NaN' },
        {
            code: '{numformat;{eval};{eval};{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 11, end: 17, error: new MarkerError('eval', 11) },
                { start: 18, end: 24, error: new MarkerError('eval', 18) },
                { start: 25, end: 31, error: new MarkerError('eval', 25) },
                { start: 32, end: 38, error: new MarkerError('eval', 32) },
                { start: 39, end: 45, error: new MarkerError('eval', 39) },
                { start: 0, end: 46, error: new TooManyArgumentsError(4, 5) }
            ]
        }

    ]
});
