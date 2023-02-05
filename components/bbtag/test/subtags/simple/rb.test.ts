import { Subtag } from '@bbtag/blargbot';
import { RbSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(RbSubtag),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        { code: '{rb}', expected: '}' }
    ]
});
