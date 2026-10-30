import { TagAuthorSubtag } from '@blargbot/bbtag-engine/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new TagAuthorSubtag(),
    argCountBounds: { min: 0, max: 0 },
    names: ['tagAuthor', 'ccAuthor', 'customCommandAuthor'],
    cases: [
        {
            code: '{tagauthor}',
            expected: '1234567',
            setup(ctx) { ctx.authorId = '1234567'; }
        },
        {
            code: '{ccauthor}',
            expected: 'abcdefg',
            setup(ctx) { ctx.authorId = 'abcdefg'; }
        }
    ]
});
