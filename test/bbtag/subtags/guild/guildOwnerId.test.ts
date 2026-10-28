import type { GetGuildOwnerIdFeature } from '@blargbot/bbtag/subtags';
import { GuildOwnerIdSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<GetGuildOwnerIdFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new GuildOwnerIdSubtag(features.instance),
    argCountBounds: { min: 0, max: 0 },
    names: ['guildOwnerId'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        {
            code: '{guildownerid}',
            expected: '2389476284936446234',
            setup(ctx) {
                features.setup(m => m.getGuildOwnerId(ctx.guildId))
                    .resolves('2389476284936446234')
                    .mustHappen(1);
            }
        }
    ]
});
