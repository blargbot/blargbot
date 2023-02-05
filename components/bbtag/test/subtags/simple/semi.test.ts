import { Subtag } from '@bbtag/blargbot';
import { SemiSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(SemiSubtag),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        { code: '{semi}', expected: ';' }
    ]
});
