import { BBTagRuntimeError, NotANumberError } from '@blargbot/bbtag/errors';
import { RoleSetPositionSubtag } from '@blargbot/bbtag/subtags/role/roleSetPosition';
import { ApiError, Constants } from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetRolePropTestCases } from './_getRolePropTest';

runSubtagTests({
    subtag: new RoleSetPositionSubtag(),
    argCountBounds: { min: 2, max: 3 },
    setup(ctx) {
        ctx.roles.authorizer.permissions = Constants.Permissions.manageRoles.toString();
        ctx.members.authorizer.roles.push(ctx.roles.top.id);
    },
    cases: [
        ...createGetRolePropTestCases({
            generateCode(role, ...args) {
                return `{${['rolesetpos', role, '0', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(role, ctx) {
                        ctx.discord.setup(m => m.editRolePosition(ctx.guild.id, role.id, 0)).thenResolve(undefined);
                    }
                }
            ]
        }),
        ...createGetRolePropTestCases({
            generateCode(role, ...args) {
                return `{${['rolesetpos', role, '2', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(role, ctx) {
                        ctx.discord.setup(m => m.editRolePosition(ctx.guild.id, role.id, 2)).thenResolve(undefined);
                    }
                }
            ]
        }),
        {
            code: '{rolesetpos;3298746326924;2}',
            expected: '`Author cannot edit roles`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Author cannot edit roles') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            }
        },
        {
            code: '{rolesetpos;3298746326924;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 30, error: new NotANumberError('abc') }
            ],
            setup(ctx) {
                ctx.roles.bot.id = '3298746326924';
            },
            postSetup(bbctx, ctx) {
                const role = bbctx.guild.roles.get('3298746326924');
                if (role === undefined)
                    throw new Error('Unable to locate role under test');

                ctx.util.setup(m => m.findRoles(bbctx.guild, '3298746326924'))
                    .thenResolve([role]);
            }
        },
        {
            code: '{rolesetpos;3298746326924;2}',
            expected: '`Role above author`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Role above author') }
            ],
            setup(ctx) {
                ctx.roles.top.id = '3298746326924';
            },
            postSetup(bbctx, ctx) {
                const role = bbctx.guild.roles.get('3298746326924');
                if (role === undefined)
                    throw new Error('Unable to locate role under test');

                ctx.util.setup(m => m.findRoles(bbctx.guild, '3298746326924'))
                    .thenResolve([role]);
            }
        },
        {
            code: '{rolesetpos;3298746326924;12}',
            expected: '`Desired position above author`',
            errors: [
                { start: 0, end: 29, error: new BBTagRuntimeError('Desired position above author') }
            ],
            setup(ctx) {
                ctx.roles.bot.id = '3298746326924';
            },
            postSetup(bbctx, ctx) {
                const role = bbctx.guild.roles.get('3298746326924');
                if (role === undefined)
                    throw new Error('Unable to locate role under test');

                ctx.util.setup(m => m.findRoles(bbctx.guild, '3298746326924'))
                    .thenResolve([role]);
            }
        },
        {
            code: '{rolesetpos;3298746326924;2}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Failed to edit role: no perms', 'Test REST error') }
            ],
            setup(ctx) {
                ctx.roles.bot.id = '3298746326924';
            },
            postSetup(bbctx, ctx) {
                const err = ctx.createRESTError(ApiError.MISSING_PERMISSIONS);
                const role = bbctx.guild.roles.get('3298746326924');
                if (role === undefined)
                    throw new Error('Unable to locate role under test');

                ctx.util.setup(m => m.findRoles(bbctx.guild, '3298746326924'))
                    .thenResolve([role]);
                ctx.discord.setup(m => m.editRolePosition(ctx.guild.id, role.id, 2))
                    .thenReject(err);
            }
        },
        {
            code: '{rolesetpos;3298746326924;2}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Failed to edit role: no perms', 'Some other error message') }
            ],
            setup(ctx) {
                ctx.roles.bot.id = '3298746326924';
            },
            postSetup(bbctx, ctx) {
                const err = ctx.createRESTError(ApiError.NOT_AUTHORIZED, 'Some other error message');
                const role = bbctx.guild.roles.get('3298746326924');
                if (role === undefined)
                    throw new Error('Unable to locate role under test');

                ctx.util.setup(m => m.findRoles(bbctx.guild, '3298746326924'))
                    .thenResolve([role]);
                ctx.discord.setup(m => m.editRolePosition(ctx.guild.id, role.id, 2))
                    .thenReject(err);
            }
        }
    ]
});
