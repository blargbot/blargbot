import { Base64DecodeSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Base64DecodeSubtag,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{base64decode;U3VjY2VzcyE}',
            expected: 'Success!'
        },
        {
            code: '{base64decode;U3VjY2VzcyE=}',
            expected: 'Success!'
        },
        {
            code: '{atob;U3VjY2VzcyE}',
            expected: 'Success!'
        },
        {
            code: '{atob;U3VjY2VzcyE=}',
            expected: 'Success!'
        }
    ]
});
