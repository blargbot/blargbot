import { Subtag } from '@blargbot/bbtag';
import { SemiSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(SemiSubtag),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        { code: '{semi}', expected: ';' }
    ]
});
