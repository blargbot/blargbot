import type { GetRoleColorFeature } from '@blargbot/bbtag-engine/subtags';
import { RoleColorSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

const features = new Mock<GetRoleColorFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new RoleColorSubtag(features.instance),
    argCountBounds: { min: 1, max: 2 },
    names: ['roleColor'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetRolePropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['rolecolor', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '4488cc',
                    setup(roleId, ctx) {
                        features.setup(m => m.getRoleColor(ctx.guildId, roleId)).resolves(0x4488cc).mustHappen(1);
                    }
                },
                {
                    expected: '000000',
                    setup(roleId, ctx) {
                        features.setup(m => m.getRoleColor(ctx.guildId, roleId)).resolves(0).mustHappen(1);
                    }
                },
                {
                    expected: 'ffffff',
                    setup(roleId, ctx) {
                        features.setup(m => m.getRoleColor(ctx.guildId, roleId)).resolves(0xffffff).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
