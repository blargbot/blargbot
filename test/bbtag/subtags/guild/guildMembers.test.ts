import type { ListGuildMembersFeature } from '@blargbot/bbtag/subtags';
import { GuildMembersSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<ListGuildMembersFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new GuildMembersSubtag(features.instance),
    argCountBounds: { min: 0, max: 0 },
    names: ['guildMembers'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        {
            code: '{guildmembers}',
            expected: '["384975638795634547536","329467864239864324","378962875436678423","237846384639462874","23746392746789426394"]',
            setup(ctx) {
                features.setup(m => m.listGuildMembers(ctx.guildId))
                    .resolves(['384975638795634547536', '329467864239864324', '378962875436678423', '237846384639462874', '23746392746789426394']);
            }
        }
    ]
});
