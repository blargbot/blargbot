import { BBTagRuntimeError } from '@blargbot/cluster/bbtag/errors';
import { RoleSetPermsSubtag } from '@blargbot/cluster/subtags/role/rolesetperms';
import { ApiError, Constants } from 'eris';

import { argument } from '../../../mock';
import { runSubtagTests } from '../SubtagTestSuite';
import { createGetRolePropTestCases } from './_getRolePropTest';

runSubtagTests({
    subtag: new RoleSetPermsSubtag(),
    argCountBounds: { min: 1, max: 3 },
    setup(ctx) {
        ctx.roles.command.permissions = Constants.Permissions.manageRoles.toString();
        ctx.members.command.roles.push(ctx.roles.top.id);
    },
    cases: [
        ...createGetRolePropTestCases({
            quiet: false,
            generateCode(role, ...args) {
                return `{${['rolesetperms', role, ...args].join(';')}}`;
            },
            notFound: () => new BBTagRuntimeError('Role not found'),
            cases: [
                {
                    expected: '',
                    postSetup(role, _, ctx) {
                        ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ permissions: 0n }), 'Command User#0000'))
                            .thenResolve(role);
                    }
                }
            ]
        }),
        ...createGetRolePropTestCases({
            quiet: false,
            generateCode(role, ...args) {
                return `{${['rolesetperms', role, '', ...args].join(';')}}`;
            },
            notFound: () => new BBTagRuntimeError('Role not found'),
            cases: [
                {
                    expected: '',
                    postSetup(role, _, ctx) {
                        ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ permissions: 0n }), 'Command User#0000'))
                            .thenResolve(role);
                    }
                }
            ]
        }),
        ...createGetRolePropTestCases({
            generateCode(role, ...args) {
                return `{${['rolesetperms', role, '239748', ...args].join(';')}}`;
            },
            notFound: () => new BBTagRuntimeError('Role not found'),
            cases: [
                {
                    title: 'Author is missing permissions',
                    expected: '',
                    postSetup(role, _, ctx) {
                        ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ permissions: 0n }), 'Command User#0000'))
                            .thenResolve(role);
                    }
                },
                {
                    title: 'Author is admin',
                    expected: '',
                    setup(_, ctx) {
                        ctx.roles.command.permissions = Constants.Permissions.administrator.toString();
                    },
                    postSetup(role, _, ctx) {
                        ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ permissions: 239748n }), 'Command User#0000'))
                            .thenResolve(role);
                    }
                },
                {
                    title: 'Author has permissions',
                    expected: '',
                    setup(_, ctx) {
                        ctx.roles.command.permissions = (Constants.Permissions.all & ~Constants.Permissions.administrator).toString();
                    },
                    postSetup(role, _, ctx) {
                        ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ permissions: 239748n }), 'Command User#0000'))
                            .thenResolve(role);
                    }
                },
                {
                    title: 'Author has partial permissions',
                    expected: '',
                    setup(_, ctx) {
                        ctx.roles.command.permissions = (
                            Constants.Permissions.manageRoles
                            | Constants.Permissions.viewAuditLog
                            | Constants.Permissions.readMessageHistory
                        ).toString();
                    },
                    postSetup(role, _, ctx) {
                        ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ permissions: 65664n }), 'Command User#0000'))
                            .thenResolve(role);
                    }
                }
            ]
        }),
        {
            code: '{rolesetperms;3298746326924}',
            expected: '`Author cannot edit roles`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Author cannot edit roles') }
            ],
            setup(ctx) {
                ctx.roles.command.permissions = '0';
            }
        },
        {
            code: '{rolesetperms;3298746326924}',
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
            code: '{rolesetperms;3298746326924}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Failed to edit role: no perms') }
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
                ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ permissions: 0n }), 'Command User#0000'))
                    .thenReject(err);
            }
        },
        {
            code: '{rolesetperms;3298746326924}',
            expected: '`Failed to edit role: Some other error message`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Failed to edit role: Some other error message') }
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
                ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ permissions: 0n }), 'Command User#0000'))
                    .thenReject(err);
            }
        }
    ]
});
