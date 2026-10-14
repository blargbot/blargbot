import { SemiSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new SemiSubtag(),
    argCountBounds: { min: 0, max: 0 },
    names: ['semi'],
    cases: [
        { code: '{semi}', expected: ';' }
    ]
});
