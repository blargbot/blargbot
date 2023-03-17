import { CommentSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: CommentSubtag,
    argCountBounds: { min: 0, max: Infinity },
    cases: [
        { code: '{comment}', expected: '' },
        { code: '{comment;{fail}}', expected: '' },
        { code: '{comment;{fail};{fail}}', expected: '' },
        { code: '{comment;{fail};{fail};{fail}}', expected: '' },
        { code: '{comment;{fail};{fail};{fail};{fail}}', expected: '' },
        { code: '{//}', expected: '' },
        { code: '{//;{fail}}', expected: '' },
        { code: '{//;{fail};{fail}}', expected: '' },
        { code: '{//;{fail};{fail};{fail}}', expected: '' },
        { code: '{//;{fail};{fail};{fail};{fail}}', expected: '' }
    ]
});
