import { PrefixSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: PrefixSubtag,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{prefix}',
            expected: 'd!',
            setup(ctx) {
                ctx.options.prefix = 'd!';
            }
        },
        {
            code: '{prefix}',
            expected: 'ghi',
            setup(ctx) {
                ctx.options.prefix = 'ghi';
            }
        }
    ]
});
