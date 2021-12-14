import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { Base64DecodeSubtag } from '@cluster/subtags/misc/base64decode';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new Base64DecodeSubtag(),
    cases: [
        {
            code: '{base64decode}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 14, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        {
            code: '{base64decode;U3VjY2VzcyE}',
            expected: 'Success!'
        },
        {
            code: '{base64decode;U3VjY2VzcyE=}',
            expected: 'Success!'
        },
        {
            code: '{base64decode;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 14, end: 20, error: new MarkerError(14) },
                { start: 21, end: 27, error: new MarkerError(21) },
                { start: 0, end: 28, error: new TooManyArgumentsError(1, 2) }
            ]
        },
        {
            code: '{atob}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 6, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        {
            code: '{atob;U3VjY2VzcyE}',
            expected: 'Success!'
        },
        {
            code: '{atob;U3VjY2VzcyE=}',
            expected: 'Success!'
        },
        {
            code: '{atob;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 6, end: 12, error: new MarkerError(6) },
                { start: 13, end: 19, error: new MarkerError(13) },
                { start: 0, end: 20, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
