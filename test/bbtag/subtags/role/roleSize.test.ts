import type { GetRoleMemberCountFeature } from '@blargbot/bbtag-engine/subtags';
import { RoleSizeSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

const features = new Mock<GetRoleMemberCountFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new RoleSizeSubtag(features.instance),
    argCountBounds: { min: 1, max: 1 },
    names: ['roleSize', 'inRole'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetRolePropTestCases({
            quiet: false,
            queryOptions: () => ({ noLookup: true, noErrors: true }),
            generateCode(...args) {
                return `{${['rolesize', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '0',
                    setup(roleId, ctx) {
                        features.setup(m => m.getRoleMemberCount(ctx.guildId, roleId)).resolves(0);
                    }
                },
                {
                    expected: '1',
                    setup(roleId, ctx) {
                        features.setup(m => m.getRoleMemberCount(ctx.guildId, roleId)).resolves(1);
                    }
                },
                {
                    expected: '2',
                    setup(roleId, ctx) {
                        features.setup(m => m.getRoleMemberCount(ctx.guildId, roleId)).resolves(2);
                    }
                }
            ]
        })
    ]
});
