import { CommentSubtag } from '@blargbot/cluster/subtags/misc/comment';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new CommentSubtag(),
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
