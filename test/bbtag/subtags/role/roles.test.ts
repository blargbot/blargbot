import type { ListGuildRolesFeature, ListMemberRolesFeature } from '@blargbot/bbtag/subtags';
import { RolesSubtag, UserIdSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from '../user/_getUserPropTest.js';

const features = new Mock<ListMemberRolesFeature & ListGuildRolesFeature>({ id: 'features' });
const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });

await runSubtagTests({
    subtag: new RolesSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['roles'],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });
    },
    cases: [
        {
            code: '{roles}',
            expected: '["2938476294246234","394085735375349786","394085735375349785","340987563405745430","394850730479533405","923874043782332894732"]',
            subtags: [userIdSubtag.instance],
            setup(ctx) {
                features.setup(m => m.listGuildRoles(ctx.guild.id))
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
                        features.setup(m => m.listMemberRoles(ctx.guild.id, userId)).resolves([]).mustHappen(1);
                    }
                },
                {
                    expected: '["098765434512212678"]',
                    setup(userId, ctx) {
                        features.setup(m => m.listMemberRoles(ctx.guild.id, userId)).resolves(['098765434512212678']).mustHappen(1);
                    }
                },
                {
                    expected: '["098765434512212678","1234567890987654"]',
                    setup(userId, ctx) {
                        features.setup(m => m.listMemberRoles(ctx.guild.id, userId)).resolves(['098765434512212678', '1234567890987654']).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
