import { Base64DecodeSubtag } from '@blargbot/bbtag/subtags/misc/base64Decode';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new Base64DecodeSubtag(),
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
