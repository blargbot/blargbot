import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { Base64EncodeSubtag } from '@cluster/subtags/misc/base64encode';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new Base64EncodeSubtag(),
    cases: [
        {
            code: '{base64encode}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 14, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        {
            code: '{base64encode;Success!}',
            expected: 'U3VjY2VzcyE='
        },
        {
            code: '{base64encode;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 14, end: 20, error: new MarkerError(14) },
                { start: 21, end: 27, error: new MarkerError(21) },
                { start: 0, end: 28, error: new TooManyArgumentsError(1, 2) }
            ]
        },
        {
            code: '{btoa}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 6, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        {
            code: '{btoa;Success!}',
            expected: 'U3VjY2VzcyE='
        },
        {
            code: '{btoa;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 6, end: 12, error: new MarkerError(6) },
                { start: 13, end: 19, error: new MarkerError(13) },
                { start: 0, end: 20, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
