import { BBTagRuntimeError, Subtag } from '@bbtag/blargbot';
import { GuildBansSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(GuildBansSubtag),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{guildbans}',
            expected: '["23946327849364832","32967423897649864"]',
            postSetup(bbctx, ctx) {
                ctx.userService.setup(m => m.findBanned(bbctx))
                    .thenResolve([
                        '23946327849364832',
                        '32967423897649864'
                    ]);
            }
        },
        {
            code: '{guildbans}',
            expected: '`Missing required permissions`',
            errors: [
                { start: 0, end: 11, error: new BBTagRuntimeError('Missing required permissions') }
            ],
            postSetup(bbctx, ctx) {
                ctx.userService.setup(m => m.findBanned(bbctx)).thenResolve('noPerms');
            }
        }
    ]
});
