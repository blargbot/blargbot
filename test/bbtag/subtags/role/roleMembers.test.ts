import type { ListRoleMembersFeature } from '@blargbot/bbtag-engine/subtags';
import { RoleMembersSubtag } from '@blargbot/bbtag-engine/subtags';
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
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['rolemembers', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    setup(roleId, ctx) {
                        features.setup(m => m.listRoleMembers(ctx.guildId, roleId)).resolves([]);
                    }
                },
                {
                    expected: '["23908467240974"]',
                    setup(roleId, ctx) {
                        features.setup(m => m.listRoleMembers(ctx.guildId, roleId)).resolves(['23908467240974']);
                    }
                },
                {
                    expected: '["23908467240974","98347593834657389"]',
                    setup(roleId, ctx) {
                        features.setup(m => m.listRoleMembers(ctx.guildId, roleId)).resolves(['23908467240974', '98347593834657389']);
                    }
                }
            ]
        })
    ]
});
