import { Subtag } from '@blargbot/bbtag';
import { ZwsSubtag } from '@blargbot/bbtag/subtags/simple/zws.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ZwsSubtag),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{zws}',
            expected: '\u200b'
        }
    ]
});
