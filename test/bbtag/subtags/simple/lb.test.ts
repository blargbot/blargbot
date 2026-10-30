import { LbSubtag } from '@blargbot/bbtag-engine/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new LbSubtag(),
    argCountBounds: { min: 0, max: 0 },
    names: ['lb'],
    cases: [
        { code: '{lb}', expected: '{' }
    ]
});
