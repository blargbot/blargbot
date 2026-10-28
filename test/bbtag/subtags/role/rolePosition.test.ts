import type { GetRolePositionFeature } from '@blargbot/bbtag/subtags';
import { RolePositionSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

const features = new Mock<GetRolePositionFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new RolePositionSubtag(features.instance),
    argCountBounds: { min: 1, max: 2 },
    names: ['rolePosition', 'rolePos'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetRolePropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['rolepos', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '2837643',
                    setup(roleId, ctx) {
                        features.setup(m => m.getRolePosition(ctx.guildId, roleId))
                            .resolves(2837643)
                            .mustHappen(1);
                    }
                }
            ]
        })
    ]
});
