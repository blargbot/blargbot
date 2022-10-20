import { SplitSubtag } from '@blargbot/bbtag/subtags/array/split';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new SplitSubtag(),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        { code: '{split;abc123}', expected: '["a","b","c","1","2","3"]' },
        { code: '{split;}', expected: '[]' },
        { code: '{split;abc123;c}', expected: '["ab","123"]' },
        { code: '{split;abc123;3}', expected: '["abc12",""]' },
        { code: '{split;abc123;a}', expected: '["","bc123"]' }
    ]
});
