import type { ListMemberRolesFeature } from '@blargbot/bbtag/subtags';
import { UserRolesSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const features = new Mock<ListMemberRolesFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new UserRolesSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['userRoles'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['userroles', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    setup(userId, ctx) {
                        features.setup(m => m.listMemberRoles(ctx.guildId, userId))
                            .resolves([])
                            .mustHappen(1);
                    }
                },
                {
                    expected: '["098765434512212678"]',
                    setup(userId, ctx) {
                        features.setup(m => m.listMemberRoles(ctx.guildId, userId))
                            .resolves(['098765434512212678'])
                            .mustHappen(1);
                    }
                },
                {
                    expected: '["098765434512212678","1234567890987654"]',
                    setup(userId, ctx) {
                        features.setup(m => m.listMemberRoles(ctx.guildId, userId))
                            .resolves(['098765434512212678', '1234567890987654'])
                            .mustHappen(1);
                    }
                }
            ]
        })
    ]
});
