import type { ListRoleMembersFeature } from '@blargbot/bbtag/subtags';
import { RoleMembersSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

const features = new Mock<ListRoleMembersFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new RoleMembersSubtag(features.instance),
    argCountBounds: { min: 1, max: 2 },
    names: ['roleMembers'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetRolePropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['rolemembers', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    setup(role, ctx) {
                        role.id = '92348672342308424';
                        features.setup(m => m.listRoleMembers(ctx.guild.id, role.id)).resolves([]);
                    }
                },
                {
                    expected: '["23908467240974"]',
                    setup(role, ctx) {
                        role.id = '29384723084374304';
                        features.setup(m => m.listRoleMembers(ctx.guild.id, role.id)).resolves(['23908467240974']);
                    }
                },
                {
                    expected: '["23908467240974","98347593834657389"]',
                    setup(role, ctx) {
                        role.id = '29384723084374304';
                        features.setup(m => m.listRoleMembers(ctx.guild.id, role.id)).resolves(['23908467240974', '98347593834657389']);
                    }
                }
            ]
        })
    ]
});
