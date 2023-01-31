import { Subtag } from '@blargbot/bbtag';
import { TagAuthorSubtag } from '@blargbot/bbtag/subtags';

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
            setup(ctx) {
                ctx.users.authorizer.id = 'NOPE';
                ctx.options.authorId = 'abcdefg';
            }
        }
    ]
});
