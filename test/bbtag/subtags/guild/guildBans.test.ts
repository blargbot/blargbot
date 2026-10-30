import { BBTagRuntimeError } from '@blargbot/bbtag-engine';
import type { GetBannedUsersFeature } from '@blargbot/bbtag-engine/subtags';
import { GuildBansSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<GetBannedUsersFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new GuildBansSubtag(features.instance),
    argCountBounds: { min: 0, max: 0 },
    names: ['guildBans'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        {
            code: '{guildbans}',
            expected: '["23946327849364832","32967423897649864"]',
            setup(ctx) {
                features.setup(m => m.getBannedUsers(ctx.guildId))
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
                features.setup(m => m.getBannedUsers(ctx.guildId))
                    .resolves(undefined);
            }
        }
    ]
});
