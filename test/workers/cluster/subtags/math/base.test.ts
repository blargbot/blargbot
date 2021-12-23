import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { BaseNumberSubtag } from '@cluster/subtags/math/base';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new BaseNumberSubtag(),
    cases: [
        {
            code: '{base}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 6, error: new NotEnoughArgumentsError(2, 0) }
            ]
        },
        {
            code: '{base;{eval}}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 6, end: 12, error: new MarkerError('eval', 6) },
                { start: 0, end: 13, error: new NotEnoughArgumentsError(2, 1) }
            ]
        },
        { code: '{base;10;16}', expected: 'a' },
        { code: '{base;10;8}', expected: '12' },
        { code: '{base;F;16;10}', expected: '15' },
        { code: '{base;F;20;8}', expected: '17' },
        {
            code: '{base;{eval};{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 6, end: 12, error: new MarkerError('eval', 6) },
                { start: 13, end: 19, error: new MarkerError('eval', 13) },
                { start: 20, end: 26, error: new MarkerError('eval', 20) },
                { start: 27, end: 33, error: new MarkerError('eval', 27) },
                { start: 0, end: 34, error: new TooManyArgumentsError(3, 4) }
            ]
        }
    ]
});
