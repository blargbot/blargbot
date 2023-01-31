import { Subtag } from '@blargbot/bbtag';
import { SpaceSubtag, TrimSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(TrimSubtag),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{trim;abc}', expected: 'abc' },
        { code: '{trim;   def   }', expected: 'def' },
        { code: '{trim;{space;10}ghi{space;10}}', expected: 'ghi', subtags: [Subtag.getDescriptor(SpaceSubtag)] }
    ]
});
