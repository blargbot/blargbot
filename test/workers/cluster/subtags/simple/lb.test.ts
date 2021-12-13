import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { LbSubtag } from '@cluster/subtags/simple/lb';

import { runSubtagTests, TestError } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new LbSubtag(),
    cases: [
        {
            code: '{lb}',
            expected: '{'
        },
        {
            code: '{lb;{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 4, end: 11, error: new TestError(4) },
                { start: 0, end: 12, error: new TooManyArgumentsError(0, 1) }
            ]
        }
    ]
});
