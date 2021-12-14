import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { Base64EncodeSubtag } from '@cluster/subtags/misc/base64encode';

import { runSubtagTests, TestError } from '../SubtagTestSuite';

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
            code: '{base64encode;{error};{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 14, end: 21, error: new TestError(14) },
                { start: 22, end: 29, error: new TestError(22) },
                { start: 0, end: 30, error: new TooManyArgumentsError(1, 2) }
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
            code: '{btoa;{error};{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 6, end: 13, error: new TestError(6) },
                { start: 14, end: 21, error: new TestError(14) },
                { start: 0, end: 22, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
