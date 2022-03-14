import { BBTagRuntimeError } from '@blargbot/cluster/bbtag/errors';
import { GuildBansSubtag } from '@blargbot/cluster/subtags/guild/guildbans';
import { ApiError, User } from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new GuildBansSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{guildbans}',
            expected: '["23946327849364832","32967423897649864"]',
            setup(ctx) {
                const user1 = ctx.createMock(User);
                const user2 = ctx.createMock(User);

                user1.setup(m => m.id).thenReturn('23946327849364832');
                user2.setup(m => m.id).thenReturn('32967423897649864');

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id))
                    .thenResolve([
                        { user: user1.instance },
                        { user: user2.instance }
                    ]);
            }
        },
        {
            code: '{guildbans}',
            expected: '`Missing required permissions`',
            errors: [
                { start: 0, end: 11, error: new BBTagRuntimeError('Missing required permissions') }
            ],
            setup(ctx) {
                const error = ctx.createRESTError(ApiError.MISSING_PERMISSIONS);
                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id))
                    .thenReject(error);
            }
        }
    ]
});
