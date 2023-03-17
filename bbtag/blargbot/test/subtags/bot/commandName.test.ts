import { CommandNameSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: CommandNameSubtag,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{commandname}',
            expected: 'My cool command',
            setup(ctx) {
                ctx.entrypoint.name = 'My cool command';
            }
        },
        {
            code: '{commandname}',
            expected: 'My cool command',
            setup(ctx) {
                ctx.entrypoint.name = 'My cool command';
            }
        }
    ]
});
