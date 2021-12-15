import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { ZwsSubtag } from '@cluster/subtags/simple/zws';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ZwsSubtag(),
    cases: [
        {
            code: '{zws}',
            expected: '\u200b'
        },
        {
            code: '{zws;{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 5, end: 11, error: new MarkerError('eval', 5) },
                { start: 0, end: 12, error: new TooManyArgumentsError(0, 1) }
            ]
        }
    ]
});
