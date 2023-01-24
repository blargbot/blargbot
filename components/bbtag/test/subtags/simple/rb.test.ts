import { Subtag } from '@blargbot/bbtag';
import { RbSubtag } from '@blargbot/bbtag/subtags/simple/rb.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(RbSubtag),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        { code: '{rb}', expected: '}' }
    ]
});
