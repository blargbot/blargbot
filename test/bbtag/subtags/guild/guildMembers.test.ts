import type { ListGuildMembersThunk } from '@blargbot/bbtag/subtags';
import { GuildMembersSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const listGuildMembers = new Mock<ListGuildMembersThunk>({ id: 'listGuildMembers', callable: true });

await runSubtagTests({
    subtag: new GuildMembersSubtag({
        listGuildMembers: listGuildMembers.instance
    }),
    argCountBounds: { min: 0, max: 0 },
    names: ['guildMembers'],
    setup(ctx) {
        ctx.adoptMock(listGuildMembers);
    },
    cases: [
        {
            code: '{guildmembers}',
            expected: '["384975638795634547536","329467864239864324","378962875436678423","237846384639462874","23746392746789426394"]',
            setup(ctx) {
                listGuildMembers.setup(m => m(ctx.guild.id))
                    .resolves(['384975638795634547536', '329467864239864324', '378962875436678423', '237846384639462874', '23746392746789426394']);
            }
        }
    ]
});
