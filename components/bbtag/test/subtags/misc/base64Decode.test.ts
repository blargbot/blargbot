import { Subtag } from '@blargbot/bbtag';
import { Base64DecodeSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(Base64DecodeSubtag),
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