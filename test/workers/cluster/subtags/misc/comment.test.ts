import { CommentSubtag } from '@cluster/subtags/misc/comment';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new CommentSubtag(),
    cases: [
        { code: '{comment}', expected: '' },
        { code: '{comment;{error}}', expected: '' },
        { code: '{comment;{error};{error}}', expected: '' },
        { code: '{comment;{error};{error};{error}}', expected: '' },
        { code: '{comment;{error};{error};{error};{error}}', expected: '' },
        { code: '{//}', expected: '' },
        { code: '{//;{error}}', expected: '' },
        { code: '{//;{error};{error}}', expected: '' },
        { code: '{//;{error};{error};{error}}', expected: '' },
        { code: '{//;{error};{error};{error};{error}}', expected: '' }
    ]
});
