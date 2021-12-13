import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { RbSubtag } from '@cluster/subtags/simple/rb';

import { runSubtagTests, TestError } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new RbSubtag(),
    cases: [
        {
            code: '{rb}',
            expected: '}'
        },
        {
            code: '{rb;{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 4, end: 11, error: new TestError(4) },
                { start: 0, end: 12, error: new TooManyArgumentsError(0, 1) }
            ]
        }
    ]
});
