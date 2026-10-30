import assert from 'node:assert/strict';

import type { ListGuildMembersFeature } from '@blargbot/bbtag-engine/subtags';
import { RandomUserSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<ListGuildMembersFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new RandomUserSubtag(features.instance),
    argCountBounds: { min: 0, max: 0 },
    names: ['randUser', 'randomUser'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        {
            code: '{randuser}',
            assert(_, result) {
                assert(['384975638795634547536', '329467864239864324', '378962875436678423', '237846384639462874', '23746392746789426394'].includes(result));
            },
            setup(ctx) {
                features.setup(m => m.listGuildMembers(ctx.guildId))
                    .resolves(['384975638795634547536', '329467864239864324', '378962875436678423', '237846384639462874', '23746392746789426394']);
            }
        }
    ]
});
