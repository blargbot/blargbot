import type { GetRoleNameFeature } from '@blargbot/bbtag-engine/subtags';
import { RoleNameSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

const features = new Mock<GetRoleNameFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new RoleNameSubtag(features.instance),
    argCountBounds: { min: 1, max: 2 },
    names: ['roleName'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetRolePropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['rolename', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'abcdef',
                    setup(roleId, ctx) {
                        features.setup(m => m.getRoleName(ctx.guildId, roleId))
                            .resolves('abcdef')
                            .mustHappen(1);
                    }
                }
            ]
        })
    ]
});
