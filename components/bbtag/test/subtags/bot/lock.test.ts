import { Subtag } from '@bbtag/blargbot';
import { LockSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(LockSubtag),
    argCountBounds: { min: { count: 3, noEval: [2] }, max: { count: 3, noEval: [2] } },
    cases: [
        // TODO: Missing tests? :o
    ]
});
