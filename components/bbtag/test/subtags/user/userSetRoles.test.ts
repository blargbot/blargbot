import { BBTagRuntimeError, NotAnArrayError, RoleNotFoundError, Subtag } from '@bbtag/blargbot';
import { UserSetRolesSubtag } from '@bbtag/blargbot/subtags';
import Discord from '@blargbot/discord-types';
import { argument } from '@blargbot/test-util/mock.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(UserSetRolesSubtag),
    argCountBounds: { min: 0, max: 3 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.ManageRoles.toString();
        ctx.users.authorizer.member.roles.push(ctx.roles.top.id);
    },
    cases: [
        {
            code: '{usersetroles}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                ctx.userService.setup(m => m.edit(bbctx, ctx.users.command.id, argument.isDeepEqual({ roles: [] }))).thenResolve(undefined);
            }
        },
        ...createGetUserPropTestCases({
            quiet: 'false',
            generateCode(...args) {
                return `{${['usersetroles', '[]', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    postSetup(member, bbctx, ctx) {
                        ctx.userService.setup(m => m.edit(bbctx, member.id, argument.isDeepEqual({ roles: [] }))).thenResolve(undefined);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            quiet: 'false',
            generateCode(...args) {
                return `{${['usersetroles', '["283674284762348926","234967249876489624"]', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(_, ctx) {
                        ctx.roles.other.id = '283674284762348926';
                        ctx.roles.bot.id = '234967249876489624';
                    },
                    postSetup(member, bbctx, ctx, q) {
                        ctx.roleService.setup(m => m.querySingle(bbctx, '283674284762348926', argument.isDeepEqual({ noLookup: q }))).thenResolve(ctx.roles.other);
                        ctx.roleService.setup(m => m.querySingle(bbctx, '234967249876489624', argument.isDeepEqual({ noLookup: q }))).thenResolve(ctx.roles.bot);
                        ctx.userService.setup(m => m.edit(bbctx, member.id, argument.isDeepEqual({ roles: ['283674284762348926', '234967249876489624'] }))).thenResolve(undefined);
                    }
                }
            ]
        }),
        {
            code: '{usersetroles}',
            expected: '`Author cannot remove roles`',
            errors: [
                { start: 0, end: 14, error: new BBTagRuntimeError('Author cannot remove roles') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            }
        },
        {
            code: '{usersetroles;abc}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 18, error: new NotAnArrayError('abc') }
            ]
        },
        {
            code: '{usersetroles;abc;;q}',
            expected: 'false',
            errors: [
                { start: 0, end: 21, error: new NotAnArrayError('abc').withDisplay('false') }
            ]
        },
        {
            code: '{usersetroles;["unknown role"]}',
            expected: '`No role found`',
            errors: [
                { start: 0, end: 31, error: new RoleNotFoundError('unknown role') }
            ],
            postSetup(bbctx, ctx) {
                ctx.roleService.setup(m => m.querySingle(bbctx, 'unknown role', argument.isDeepEqual({ noLookup: false }))).thenResolve(undefined);
            }
        },
        {
            code: '{usersetroles;["unknown role"];;q}',
            expected: 'false',
            errors: [
                { start: 0, end: 34, error: new RoleNotFoundError('unknown role').withDisplay('false') }
            ],
            postSetup(bbctx, ctx) {
                ctx.roleService.setup(m => m.querySingle(bbctx, 'unknown role', argument.isDeepEqual({ noLookup: true }))).thenResolve(undefined);
            }
        }
    ]
});
