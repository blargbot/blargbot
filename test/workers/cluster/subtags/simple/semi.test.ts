import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { SemiSubtag } from '@cluster/subtags/simple/semi';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new SemiSubtag(),
    cases: [
        {
            code: '{semi}',
            expected: ';'
        },
        {
            code: '{semi;{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 6, end: 12, error: new MarkerError(6) },
                { start: 0, end: 13, error: new TooManyArgumentsError(0, 1) }
            ]
        }
    ]
});
