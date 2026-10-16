import type { GetRoleMemberCountThunk } from '@blargbot/bbtag/subtags';
import { RoleSizeSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

const getRoleMemberCount = new Mock<GetRoleMemberCountThunk>({ id: 'getRoleMemberCount', callable: true });

await runSubtagTests({
    subtag: new RoleSizeSubtag({
        getRoleMemberCount: getRoleMemberCount.instance
    }),
    argCountBounds: { min: 1, max: 1 },
    names: ['roleSize', 'inRole'],
    setup(ctx) {
        ctx.adoptMock(getRoleMemberCount);
    },
    cases: [
        ...createGetRolePropTestCases({
            quiet: false,
            generateCode(...args) {
                return `{${['rolesize', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '0',
                    setup(role, ctx) {
                        role.id = '92348672342308424';
                        getRoleMemberCount.setup(m => m(ctx.guild.id, role.id)).resolves(0);
                    }
                },
                {
                    expected: '1',
                    setup(role, ctx) {
                        role.id = '29384723084374304';
                        getRoleMemberCount.setup(m => m(ctx.guild.id, role.id)).resolves(1);
                    }
                },
                {
                    expected: '2',
                    setup(role, ctx) {
                        role.id = '29384723084374304';
                        getRoleMemberCount.setup(m => m(ctx.guild.id, role.id)).resolves(2);
                    }
                }
            ]
        })
    ]
});
