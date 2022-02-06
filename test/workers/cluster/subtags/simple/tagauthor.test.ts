import { TagAuthorSubtag } from '@cluster/subtags/simple/tagauthor';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new TagAuthorSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{tagauthor}',
            expected: '1234567',
            setup(ctx) { ctx.options.author = '1234567'; }
        },
        {
            code: '{ccauthor}',
            expected: 'abcdefg',
            setup(ctx) { ctx.options.author = 'abcdefg'; }
        }
    ]
});
