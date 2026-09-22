import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.tagAuthorizerReplacer,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{tagauthorizer}',
            expected: '1234567',
            setup(ctx) { ctx.locals.setup(x => x.authorizerId).returns('1234567'); }
        },
        {
            code: '{ccauthorizer}',
            expected: 'abcdefg',
            setup(ctx) { ctx.locals.setup(x => x.authorizerId).returns('abcdefg'); }
        }
    ]
});
