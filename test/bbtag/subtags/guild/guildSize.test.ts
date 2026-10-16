import type { GetGuildMemberCountThunk } from '@blargbot/bbtag/subtags';
import { GuildSizeSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const getGuildMemberCount = new Mock<GetGuildMemberCountThunk>({ id: 'getGuildMemberCount', callable: true });

await runSubtagTests({
    subtag: new GuildSizeSubtag({
        getGuildMemberCount: getGuildMemberCount.instance
    }),
    argCountBounds: { min: 0, max: 0 },
    names: ['guildSize', 'inGuild'],
    setup(ctx) {
        ctx.adoptMock(getGuildMemberCount);
    },
    cases: [
        {
            code: '{guildsize}',
            expected: '123',
            setup(ctx) {
                getGuildMemberCount.setup(m => m(ctx.guild.id))
                    .resolves(123);
            }
        }
    ]
});
