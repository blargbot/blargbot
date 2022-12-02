import { SpaceSubtag } from '@blargbot/bbtag/subtags/misc/space.js';
import { TrimSubtag } from '@blargbot/bbtag/subtags/misc/trim.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new TrimSubtag(),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{trim;abc}', expected: 'abc' },
        { code: '{trim;   def   }', expected: 'def' },
        { code: '{trim;{space;10}ghi{space;10}}', expected: 'ghi', subtags: [new SpaceSubtag()] }
    ]
});
