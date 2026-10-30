import { CommandNameSubtag } from '@blargbot/bbtag-engine/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new CommandNameSubtag(),
    argCountBounds: { min: 0, max: 0 },
    names: ['commandName'],
    cases: [
        {
            code: '{commandname}',
            expected: 'My cool command',
            setup(ctx) {
                ctx.tagName = 'My cool command';
            }
        },
        {
            code: '{commandname}',
            expected: 'My cool command',
            setup(ctx) {
                ctx.tagName = 'My cool command';
                ctx.bbtag.enterScope();
                ctx.bbtag.local.tagName = 'WRONG';
            }
        }
    ]
});
