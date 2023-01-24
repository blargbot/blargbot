import { Subtag } from '@blargbot/bbtag';
import { MaxSubtag } from '@blargbot/bbtag/subtags/math/max.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(MaxSubtag),
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        { code: '{max;1;2;3;4;5}', expected: '5' },
        { code: '{max;5;4;3;2;1}', expected: '5' },
        { code: '{max;16;-1000;32;5;31}', expected: '32' },
        { code: '{max;[1,"2",3,4];5;[6,7,"8"]}', expected: '8' },
        { code: '{max;[1,"2",3,4];5;["abc",6,7,"8"]}', expected: 'NaN' }
    ]
});
