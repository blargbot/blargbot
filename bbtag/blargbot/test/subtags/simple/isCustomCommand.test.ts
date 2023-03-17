import { IsCustomCommandSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: IsCustomCommandSubtag,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{iscc}',
            expected: 'true',
            setup(ctx) { ctx.options.isCC = true; }
        },
        {
            code: '{iscc}',
            expected: 'false',
            setup(ctx) { ctx.options.isCC = false; }
        }
    ]
});
