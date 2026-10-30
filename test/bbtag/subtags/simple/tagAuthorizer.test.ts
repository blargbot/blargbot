import { TagAuthorizerSubtag } from '@blargbot/bbtag-engine/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new TagAuthorizerSubtag(),
    argCountBounds: { min: 0, max: 0 },
    names: ['tagAuthorizer', 'ccAuthorizer', 'customCommandAuthorizer'],
    cases: [
        {
            code: '{tagauthorizer}',
            expected: '1234567',
            setup(ctx) { ctx.authorizerId = '1234567'; }
        },
        {
            code: '{ccauthorizer}',
            expected: 'abcdefg',
            setup(ctx) { ctx.authorizerId = 'abcdefg'; }
        }
    ]
});
