import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { GuildBansSubtag } from '@blargbot/bbtag/subtags/guild/guildBans.js';
import * as Eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new GuildBansSubtag(),
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
                const error = ctx.createRESTError(Eris.ApiError.MISSING_PERMISSIONS);
                ctx.util.setup(m => m.getBannedUsers(bbctx.guild))
                    .thenReject(error);
            }
        }
    ]
});
