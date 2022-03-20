import { MinSubtag } from '@blargbot/bbtag/subtags/math/min';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new MinSubtag(),
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        { code: '{min;1;2;3;4;5}', expected: '1' },
        { code: '{min;5;4;3;2;1}', expected: '1' },
        { code: '{min;16;-1000;32;5;31}', expected: '-1000' },
        { code: '{min;[1,"2",3,4];5;[6,7,"8"]}', expected: '1' },
        { code: '{min;[1,"2",3,4];5;["abc",6,7,"8"]}', expected: 'NaN' }
    ]
});
