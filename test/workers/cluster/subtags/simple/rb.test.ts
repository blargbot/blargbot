import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { RbSubtag } from '@cluster/subtags/simple/rb';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new RbSubtag(),
    cases: [
        {
            code: '{rb}',
            expected: '}'
        },
        {
            code: '{rb;{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 4, end: 10, error: new MarkerError(4) },
                { start: 0, end: 11, error: new TooManyArgumentsError(0, 1) }
            ]
        }
    ]
});
