import type { ListGuildRolesFeature, ListMemberRolesFeature } from '@blargbot/bbtag-engine/subtags';
import { RolesSubtag, UserIdSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from '../user/_getUserPropTest.js';

const features = new Mock<ListMemberRolesFeature & ListGuildRolesFeature>({ id: 'features' });
const userIdSubtag = createMockSubtag(UserIdSubtag);

await runSubtagTests({
    subtag: new RolesSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['roles'],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(userIdSubtag);
    },
    cases: [
        {
            code: '{roles}',
            expected: '["2938476294246234","394085735375349786","394085735375349785","340987563405745430","394850730479533405","923874043782332894732"]',
            subtags: [userIdSubtag.instance],
            setup(ctx) {
                features.setup(m => m.listGuildRoles(ctx.guildId))
                    .resolves([
                        '2938476294246234',
                        '394085735375349786',
                        '394085735375349785',
                        '340987563405745430',
                        '394850730479533405',
                        '923874043782332894732'
                    ])
                    .mustHappen(1);
            }
        },
        ...createGetUserPropTestCases({
            quiet: '',
            includeNoArgs: false,
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['roles', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    setup(userId, ctx) {
                        features.setup(m => m.listMemberRoles(ctx.guildId, userId)).resolves([]).mustHappen(1);
                    }
                },
                {
                    expected: '["098765434512212678"]',
                    setup(userId, ctx) {
                        features.setup(m => m.listMemberRoles(ctx.guildId, userId)).resolves(['098765434512212678']).mustHappen(1);
                    }
                },
                {
                    expected: '["098765434512212678","1234567890987654"]',
                    setup(userId, ctx) {
                        features.setup(m => m.listMemberRoles(ctx.guildId, userId)).resolves(['098765434512212678', '1234567890987654']).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
