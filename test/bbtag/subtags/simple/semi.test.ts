import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.semiReplacer,
    names: ['semi'],
    argCountBounds: { min: 0, max: 0 },
    cases: [
        { code: '{semi}', expected: ';' }
    ]
});
