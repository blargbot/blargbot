import { SpaceSubtag, TrimSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new TrimSubtag(),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{trim;abc}', expected: 'abc' },
        { code: '{trim;   def   }', expected: 'def' },
        { code: '{trim;{space;10}ghi{space;10}}', expected: 'ghi', subtags: [new SpaceSubtag()] }
    ]
});
