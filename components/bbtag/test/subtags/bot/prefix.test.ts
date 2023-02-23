import { Subtag } from '@bbtag/blargbot';
import { PrefixSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(PrefixSubtag),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{prefix}',
            expected: 'b!',
            setup(ctx) {
                ctx.util.setup(m => m.defaultPrefix, false).thenReturn('b!');
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
