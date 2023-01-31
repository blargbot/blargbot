import { Subtag } from '@blargbot/bbtag';
import { LockSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(LockSubtag),
    argCountBounds: { min: { count: 3, noEval: [2] }, max: { count: 3, noEval: [2] } },
    cases: [

    ]
});
