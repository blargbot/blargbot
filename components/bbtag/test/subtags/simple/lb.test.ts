import { LbSubtag } from '@blargbot/bbtag/subtags/simple/lb';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new LbSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        { code: '{lb}', expected: '{' }
    ]
});
