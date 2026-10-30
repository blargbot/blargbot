import { Base64DecodeSubtag } from '@blargbot/bbtag-engine/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new Base64DecodeSubtag(),
    argCountBounds: { min: 1, max: 1 },
    names: ['base64Decode', 'aToB'],
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
