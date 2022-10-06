import { SemiSubtag } from '@blargbot/bbtag/subtags/simple/semi';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new SemiSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        { code: `{semi}`, expected: `;` }
    ]
});
