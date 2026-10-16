import assert from 'node:assert/strict';

import type { ListGuildMembersThunk } from '@blargbot/bbtag/subtags';
import { RandomUserSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const listGuildMembers = new Mock<ListGuildMembersThunk>({ id: 'listGuildMembers', callable: true });

await runSubtagTests({
    subtag: new RandomUserSubtag({
        listGuildMembers: listGuildMembers.instance
    }),
    argCountBounds: { min: 0, max: 0 },
    names: ['randUser', 'randomUser'],
    setup(ctx) {
        ctx.adoptMock(listGuildMembers);
    },
    cases: [
        {
            code: '{randuser}',
            assert(_, result) {
                assert(['384975638795634547536', '329467864239864324', '378962875436678423', '237846384639462874', '23746392746789426394'].includes(result));
            },
            setup(ctx) {
                listGuildMembers.setup(m => m(ctx.guild.id))
                    .resolves(['384975638795634547536', '329467864239864324', '378962875436678423', '237846384639462874', '23746392746789426394']);
            }
        }
    ]
});
