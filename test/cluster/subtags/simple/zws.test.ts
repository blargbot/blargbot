import { ZwsSubtag } from '@blargbot/cluster/subtags/simple/zws';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ZwsSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{zws}',
            expected: '\u200b'
        }
    ]
});
