import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.md5Replacer,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{md5;some cool text here}', expected: 'dc15a13d3e070e8151301f4430d214e7' }
    ]
});
