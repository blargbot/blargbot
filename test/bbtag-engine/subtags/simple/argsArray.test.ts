import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.argsArrayReplacer,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{argsarray}',
            expected: '[]',
            setup(ctx) { ctx.locals.setup(x => x.args).returns({ raw: '', positional: [] }); }
        },
        {
            code: '{argsarray}',
            expected: '["this","is","a","test"]',
            setup(ctx) { ctx.locals.setup(x => x.args).returns({ raw: '', positional: ['this', 'is', 'a', 'test'] }); }
        },
        {
            code: '{argsarray}',
            expected: '["this","is a","test"]',
            setup(ctx) { ctx.locals.setup(x => x.args).returns({ raw: '', positional: ['this', 'is a', 'test'] }); }
        }
    ]
});
