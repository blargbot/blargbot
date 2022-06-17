import { TagAuthorSubtag } from '@blargbot/bbtag/subtags/simple/tagauthor';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new TagAuthorSubtag(),
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
