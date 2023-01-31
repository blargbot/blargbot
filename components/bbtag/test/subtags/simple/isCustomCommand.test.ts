import { Subtag } from '@blargbot/bbtag';
import { IsCustomCommandSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(IsCustomCommandSubtag),
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
