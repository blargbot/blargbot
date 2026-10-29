import { RoleNotFoundError } from '@blargbot/bbtag';
import type { ListGuildRolesFeature, ListMemberRolesFeature } from '@blargbot/bbtag/subtags';
import { UserHasRoleSubtag, UserIdSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const features = new Mock<ListMemberRolesFeature & ListGuildRolesFeature>({ id: 'features' });
const userIdSubtag = createMockSubtag(UserIdSubtag);

await runSubtagTests({
    subtag: new UserHasRoleSubtag(features.instance),
    argCountBounds: { min: 1, max: 3 },
    names: ['hasRole', 'userHasRole'],
    otherSubtags: [userIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(userIdSubtag);
    },
    cases: [
        {
            code: '{userhasrole;}',
            expected: '`No role found`',
            subtags: [userIdSubtag.instance],
            errors: [
                { error: new RoleNotFoundError('') }
            ],
            setup(ctx) {
                features.setup(m => m.listGuildRoles(ctx.guildId))
                    .resolves(['12345678901234567'])
                    .mustHappen(1);
                features.setup(m => m.listMemberRoles(ctx.guildId, ctx.userId))
                    .resolves(['12345678901234567'])
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '', $({ noLookup: false })))
                    .resolves(ctx.userId)
                    .mustHappen(1);
            }
        },
        ...createGetUserPropTestCases({
            quiet: 'false',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['userhasrole', '12345678901234567', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(userId, ctx) {
                        features.setup(m => m.listGuildRoles(ctx.guildId))
                            .resolves(['12345678901234567'])
                            .mustHappen(1);
                        features.setup(m => m.listMemberRoles(ctx.guildId, userId))
                            .resolves(['12345678901234567'])
                            .mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            quiet: 'false',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['userhasrole', '09876544321098765', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'false',
                    setup(userId, ctx) {
                        features.setup(m => m.listGuildRoles(ctx.guildId))
                            .resolves(['09876544321098765'])
                            .mustHappen(1);
                        features.setup(m => m.listMemberRoles(ctx.guildId, userId))
                            .resolves([])
                            .mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            quiet: 'false',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['userhasrole', '["12345678901234567"]', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(userId, ctx) {
                        features.setup(m => m.listGuildRoles(ctx.guildId))
                            .resolves(['12345678901234567'])
                            .mustHappen(1);
                        features.setup(m => m.listMemberRoles(ctx.guildId, userId))
                            .resolves(['12345678901234567'])
                            .mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            quiet: 'false',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['userhasrole', '["09876544321098765"]', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'false',
                    setup(userId, ctx) {
                        features.setup(m => m.listGuildRoles(ctx.guildId))
                            .resolves(['09876544321098765'])
                            .mustHappen(1);
                        features.setup(m => m.listMemberRoles(ctx.guildId, userId))
                            .resolves([])
                            .mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            quiet: 'false',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['userhasrole', '["123456788909876543","12345678901234567"]', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(userId, ctx) {
                        features.setup(m => m.listGuildRoles(ctx.guildId))
                            .resolves(['123456788909876543', '12345678901234567'])
                            .mustHappen(1);
                        features.setup(m => m.listMemberRoles(ctx.guildId, userId))
                            .resolves(['12345678901234567'])
                            .mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            quiet: 'false',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['userhasrole', '["09876544321098765", "123456788909876543"]', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'false',
                    setup(userId, ctx) {
                        features.setup(m => m.listGuildRoles(ctx.guildId))
                            .resolves(['09876544321098765', '123456788909876543'])
                            .mustHappen(1);
                        features.setup(m => m.listMemberRoles(ctx.guildId, userId))
                            .resolves([])
                            .mustHappen(1);
                    }
                }
            ]
        }),
        {
            code: '{userhasrole;aaaaaa}',
            expected: '`No role found`',
            subtags: [userIdSubtag.instance],
            errors: [
                { error: new RoleNotFoundError('aaaaaa') }
            ],
            setup(ctx) {
                features.setup(m => m.listGuildRoles(ctx.guildId))
                    .resolves(['12345678901234567'])
                    .mustHappen(1);
                features.setup(m => m.listMemberRoles(ctx.guildId, ctx.userId))
                    .resolves(['12345678901234567'])
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '', $({ noLookup: false })))
                    .resolves(ctx.userId)
                    .mustHappen(1);
            }
        },
        {
            code: '{userhasrole;aaaaaa;;q}',
            expected: 'false',
            subtags: [userIdSubtag.instance],
            errors: [
                { error: new RoleNotFoundError('aaaaaa').withDisplay('false') }
            ],
            setup(ctx) {
                features.setup(m => m.listGuildRoles(ctx.guildId))
                    .resolves(['12345678901234567'])
                    .mustHappen(1);
                features.setup(m => m.listMemberRoles(ctx.guildId, ctx.userId))
                    .resolves(['12345678901234567'])
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '', $({ noLookup: true })))
                    .resolves(ctx.userId)
                    .mustHappen(1);
            }
        }
    ]
});
