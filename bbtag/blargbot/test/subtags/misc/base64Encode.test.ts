import { Base64EncodeSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Base64EncodeSubtag,
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
