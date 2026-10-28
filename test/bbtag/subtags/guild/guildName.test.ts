import type { GetGuildNameFeature } from '@blargbot/bbtag/subtags';
import { GuildNameSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<GetGuildNameFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new GuildNameSubtag(features.instance),
    argCountBounds: { min: 0, max: 0 },
    names: ['guildName'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        {
            code: '{guildname}',
            expected: 'My super cool guild',
            setup(ctx) {
                features.setup(m => m.getGuildName(ctx.guildId))
                    .resolves('My super cool guild')
                    .mustHappen(1);
            }
        }
    ]
});
