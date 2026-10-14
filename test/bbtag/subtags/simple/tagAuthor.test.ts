import { TagAuthorSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new TagAuthorSubtag(),
    argCountBounds: { min: 0, max: 0 },
    names: ['tagAuthor', 'ccAuthor', 'customCommandAuthor'],
    cases: [
        {
            code: '{tagauthor}',
            expected: '1234567',
            setup(ctx) { ctx.input.author = '1234567'; }
        },
        {
            code: '{ccauthor}',
            expected: 'abcdefg',
            setup(ctx) { ctx.input.author = 'abcdefg'; }
        }
    ]
});
