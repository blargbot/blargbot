import { SemiSubtag } from '@blargbot/bbtag/subtags/simple/semi.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new SemiSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        { code: '{semi}', expected: ';' }
    ]
});
