import { Subtag } from '@blargbot/bbtag';
import { LbSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(LbSubtag),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        { code: '{lb}', expected: '{' }
    ]
});
