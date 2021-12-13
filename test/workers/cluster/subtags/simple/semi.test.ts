import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { SemiSubtag } from '@cluster/subtags/simple/semi';

import { runSubtagTests, TestError } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new SemiSubtag(),
    cases: [
        {
            code: '{semi}',
            expected: ';'
        },
        {
            code: '{semi;{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 6, end: 13, error: new TestError(6) },
                { start: 0, end: 14, error: new TooManyArgumentsError(0, 1) }
            ]
        }
    ]
});
