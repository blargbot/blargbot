import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.tagAuthorReplacer,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{tagauthor}',
            expected: '1234567',
            setup(ctx) { ctx.locals.setup(x => x.authorId).returns('1234567'); }
        },
        {
            code: '{ccauthor}',
            expected: 'abcdefg',
            setup(ctx) { ctx.locals.setup(x => x.authorId).returns('abcdefg'); }
        }
    ]
});
