import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { LbSubtag } from '@cluster/subtags/simple/lb';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new LbSubtag(),
    cases: [
        {
            code: '{lb}',
            expected: '{'
        },
        {
            code: '{lb;{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 4, end: 10, error: new MarkerError(4) },
                { start: 0, end: 11, error: new TooManyArgumentsError(0, 1) }
            ]
        }
    ]
});
