import { Subtag } from '@blargbot/bbtag';
import { CommandNameSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(CommandNameSubtag),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{commandname}',
            expected: 'My cool command',
            setup(ctx) {
                ctx.options.tagName = 'My cool command';
            }
        },
        {
            code: '{commandname}',
            expected: 'My cool command',
            setup(ctx) {
                ctx.options.rootTagName = 'My cool command';
                ctx.options.tagName = 'WRONG';
            }
        }
    ]
});
