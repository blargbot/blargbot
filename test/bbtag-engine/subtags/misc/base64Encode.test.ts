import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.base64EncodeReplacer,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{base64encode;Success!}',
            expected: 'U3VjY2VzcyE='
        },
        {
            code: '{btoa;Success!}',
            expected: 'U3VjY2VzcyE='
        }
    ]
});
