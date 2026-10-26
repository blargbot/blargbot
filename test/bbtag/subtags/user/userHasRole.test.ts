import { RoleNotFoundError } from '@blargbot/bbtag';
import type { ListGuildRolesFeature, ListMemberRolesFeature } from '@blargbot/bbtag/subtags';
import { UserHasRoleSubtag, UserIdSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const features = new Mock<ListMemberRolesFeature & ListGuildRolesFeature>({ id: 'features' });
const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });

await runSubtagTests({
    subtag: new UserHasRoleSubtag(features.instance),
    argCountBounds: { min: 1, max: 3 },
    names: ['hasRole', 'userHasRole'],
    otherSubtags: [userIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });
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
                features.setup(m => m.listGuildRoles(ctx.guild.id))
                    .resolves(['12345678901234567'])
                    .mustHappen(1);
                features.setup(m => m.listMemberRoles(ctx.guild.id, ctx.users.command.id))
                    .resolves(['12345678901234567'])
                    .mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, '', $({ noLookup: false })))
                    .resolves(ctx.users.command.id)
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
                        features.setup(m => m.listGuildRoles(ctx.guild.id))
                            .resolves(['12345678901234567'])
                            .mustHappen(1);
                        features.setup(m => m.listMemberRoles(ctx.guild.id, userId))
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
                        features.setup(m => m.listGuildRoles(ctx.guild.id))
                            .resolves(['09876544321098765'])
                            .mustHappen(1);
                        features.setup(m => m.listMemberRoles(ctx.guild.id, userId))
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
                        features.setup(m => m.listGuildRoles(ctx.guild.id))
                            .resolves(['12345678901234567'])
                            .mustHappen(1);
                        features.setup(m => m.listMemberRoles(ctx.guild.id, userId))
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
                        features.setup(m => m.listGuildRoles(ctx.guild.id))
                            .resolves(['09876544321098765'])
                            .mustHappen(1);
                        features.setup(m => m.listMemberRoles(ctx.guild.id, userId))
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
                        features.setup(m => m.listGuildRoles(ctx.guild.id))
                            .resolves(['123456788909876543', '12345678901234567'])
                            .mustHappen(1);
                        features.setup(m => m.listMemberRoles(ctx.guild.id, userId))
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
                        features.setup(m => m.listGuildRoles(ctx.guild.id))
                            .resolves(['09876544321098765', '123456788909876543'])
                            .mustHappen(1);
                        features.setup(m => m.listMemberRoles(ctx.guild.id, userId))
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
                features.setup(m => m.listGuildRoles(ctx.guild.id))
                    .resolves(['12345678901234567'])
                    .mustHappen(1);
                features.setup(m => m.listMemberRoles(ctx.guild.id, ctx.users.command.id))
                    .resolves(['12345678901234567'])
                    .mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, '', $({ noLookup: false })))
                    .resolves(ctx.users.command.id)
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
                features.setup(m => m.listGuildRoles(ctx.guild.id))
                    .resolves(['12345678901234567'])
                    .mustHappen(1);
                features.setup(m => m.listMemberRoles(ctx.guild.id, ctx.users.command.id))
                    .resolves(['12345678901234567'])
                    .mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, '', $({ noLookup: true })))
                    .resolves(ctx.users.command.id)
                    .mustHappen(1);
            }
        }
    ]
});
