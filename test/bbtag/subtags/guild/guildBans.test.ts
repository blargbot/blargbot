import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { GetBannedUsersThunk } from '@blargbot/bbtag/subtags';
import { GuildBansSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const getBannedUsers = new Mock<GetBannedUsersThunk>({ id: 'getBannedUsers', callable: true });

await runSubtagTests({
    subtag: new GuildBansSubtag({
        getBannedUsers: getBannedUsers.instance
    }),
    argCountBounds: { min: 0, max: 0 },
    names: ['guildBans'],
    setup(ctx) {
        ctx.adoptMock(getBannedUsers);
    },
    cases: [
        {
            code: '{guildbans}',
            expected: '["23946327849364832","32967423897649864"]',
            setup(ctx) {
                getBannedUsers.setup(m => m(ctx.guild.id))
                    .resolves([
                        '23946327849364832',
                        '32967423897649864'
                    ]);
            }
        },
        {
            code: '{guildbans}',
            expected: '`Missing required permissions`',
            errors: [
                { error: new BBTagRuntimeError('Missing required permissions') }
            ],
            setup(ctx) {
                getBannedUsers.setup(m => m(ctx.guild.id))
                    .resolves(undefined);
            }
        }
    ]
});
