import { ZwsSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new ZwsSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{zws}',
            expected: '\u200b'
        }
    ]
});
