import { Subtag } from '@blargbot/bbtag';
import { TagAuthorSubtag } from '@blargbot/bbtag/subtags/simple/tagAuthor.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(TagAuthorSubtag),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{tagauthor}',
            expected: '1234567',
            setup(ctx) { ctx.options.authorId = '1234567'; }
        },
        {
            code: '{ccauthor}',
            expected: 'abcdefg',
            setup(ctx) { ctx.options.authorId = 'abcdefg'; }
        }
    ]
});
