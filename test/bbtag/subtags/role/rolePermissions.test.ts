import { DiscordPermissions } from '@blargbot/bbtag';
import type { GetRolePermissionsFeature } from '@blargbot/bbtag/subtags';
import { RolePermissionsSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

const features = new Mock<GetRolePermissionsFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new RolePermissionsSubtag(features.instance),
    argCountBounds: { min: 1, max: 2 },
    names: ['rolePermissions', 'rolePerms'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetRolePropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['roleperms', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '23178324',
                    setup(roleId, ctx) {
                        features.setup(m => m.getRolePermissions(ctx.guildId, roleId))
                            .resolves(new DiscordPermissions(23178324n))
                            .mustHappen(1);
                    }
                }
            ]
        })
    ]
});
