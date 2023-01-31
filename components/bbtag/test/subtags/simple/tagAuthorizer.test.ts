import { Subtag } from '@blargbot/bbtag';
import { TagAuthorizerSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(TagAuthorizerSubtag),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{tagauthorizer}',
            expected: '1234567',
            setup(ctx) {
                ctx.users.authorizer.id = '1234567';
            }
        },
        {
            code: '{ccauthorizer}',
            expected: 'abcdefg',
            setup(ctx) {
                ctx.users.authorizer.id = 'abcdefg';
                ctx.options.authorId = 'NOPE';
            }
        }
    ]
});
