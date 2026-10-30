import { RbSubtag } from '@blargbot/bbtag-engine/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new RbSubtag(),
    argCountBounds: { min: 0, max: 0 },
    names: ['rb'],
    cases: [
        { code: '{rb}', expected: '}' }
    ]
});
