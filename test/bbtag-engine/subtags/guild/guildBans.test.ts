import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.guildBansReplacer,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{guildbans}',
            expected: '["23946327849364832","32967423897649864"]',
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.getBannedUsers(bbctx.guild))
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
                { start: 0, end: 11, error: new BBTagRuntimeError('Missing required permissions', 'Test REST error') }
            ],
            postSetup(bbctx, ctx) {
                const error = ctx.createRESTError(eris.ApiError.MISSING_PERMISSIONS);
                ctx.util.setup(m => m.getBannedUsers(bbctx.guild))
                    .thenReject(error);
            }
        }
    ]
});
