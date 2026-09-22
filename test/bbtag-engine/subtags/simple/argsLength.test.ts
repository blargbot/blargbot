import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.argsLengthReplacer,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{argslength}',
            expected: '0',
            setup(ctx) { ctx.locals.setup(x => x.args).returns({ raw: '', positional: [] }); }
        },
        {
            code: '{argslength}',
            expected: '4',
            setup(ctx) { ctx.locals.setup(x => x.args).returns({ raw: '', positional: ['this', 'is', 'a', 'test'] }); }
        },
        {
            code: '{argslength}',
            expected: '3',
            setup(ctx) { ctx.locals.setup(x => x.args).returns({ raw: '', positional: ['this', 'is a', 'test'] }); }
        }
    ]
});
