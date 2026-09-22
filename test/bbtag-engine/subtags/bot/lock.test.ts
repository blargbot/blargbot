import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.lockReplacer,
    argCountBounds: { min: { count: 3, noEval: [2] }, max: { count: 3, noEval: [2] } },
    cases: [

    ]
});
