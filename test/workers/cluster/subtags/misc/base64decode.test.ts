import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { Base64DecodeSubtag } from '@cluster/subtags/misc/base64decode';

import { runSubtagTests, TestError } from '../SubtagTestSuite';

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
            code: '{base64decode;{error};{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 14, end: 21, error: new TestError(14) },
                { start: 22, end: 29, error: new TestError(22) },
                { start: 0, end: 30, error: new TooManyArgumentsError(1, 2) }
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
            code: '{atob;{error};{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 6, end: 13, error: new TestError(6) },
                { start: 14, end: 21, error: new TestError(14) },
                { start: 0, end: 22, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
