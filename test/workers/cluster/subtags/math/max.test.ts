import { NotEnoughArgumentsError } from '@cluster/bbtag/errors';
import { MaxSubtag } from '@cluster/subtags/math/max';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new MaxSubtag(),
    cases: [
        {
            code: '{max}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 5, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        { code: '{max;1;2;3;4;5}', expected: '5' },
        { code: '{max;5;4;3;2;1}', expected: '5' },
        { code: '{max;16;-1000;32;5;31}', expected: '32' },
        { code: '{max;[1,"2",3,4];5;[6,7,"8"]}', expected: '8' },
        { code: '{max;[1,"2",3,4];5;["abc",6,7,"8"]}', expected: 'NaN' }
    ]
});
