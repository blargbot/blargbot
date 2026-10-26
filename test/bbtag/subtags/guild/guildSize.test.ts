import type { GetGuildMemberCountFeature } from '@blargbot/bbtag/subtags';
import { GuildSizeSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<GetGuildMemberCountFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new GuildSizeSubtag(features.instance),
    argCountBounds: { min: 0, max: 0 },
    names: ['guildSize', 'inGuild'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        {
            code: '{guildsize}',
            expected: '123',
            setup(ctx) {
                features.setup(m => m.getGuildMemberCount(ctx.guild.id))
                    .resolves(123);
            }
        }
    ]
});
