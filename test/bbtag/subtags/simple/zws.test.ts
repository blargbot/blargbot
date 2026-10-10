import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.zwsReplacer,
    names: ['zws'],
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{zws}',
            expected: '\u200b'
        }
    ]
});
