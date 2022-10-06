import { Base64EncodeSubtag } from '@blargbot/bbtag/subtags/misc/base64encode';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new Base64EncodeSubtag(),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: `{base64encode;Success!}`,
            expected: `U3VjY2VzcyE=`
        },
        {
            code: `{btoa;Success!}`,
            expected: `U3VjY2VzcyE=`
        }
    ]
});
