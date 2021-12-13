import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { ZwsSubtag } from '@cluster/subtags/simple/zws';

import { runSubtagTests, TestError } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ZwsSubtag(),
    cases: [
        {
            code: '{zws}',
            expected: '\u200b'
        },
        {
            code: '{zws;{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 5, end: 12, error: new TestError(5) },
                { start: 0, end: 13, error: new TooManyArgumentsError(0, 1) }
            ]
        }
    ]
});
