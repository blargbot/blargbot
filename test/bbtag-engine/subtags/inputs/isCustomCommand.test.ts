import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.isCustomCommandReplacer,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{iscc}',
            expected: 'true',
            setup(ctx) { ctx.locals.setup(x => x.isCC).returns(true); }
        },
        {
            code: '{iscc}',
            expected: 'false',
            setup(ctx) { ctx.locals.setup(x => x.isCC).returns(false); }
        }
    ]
});
