import { SemiSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: SemiSubtag,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        { code: '{semi}', expected: ';' }
    ]
});
