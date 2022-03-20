import { LockSubtag } from '@blargbot/bbtag/subtags/bot/lock';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new LockSubtag(),
    argCountBounds: { min: { count: 3, noEval: [2] }, max: { count: 3, noEval: [2] } },
    cases: [

    ]
});
