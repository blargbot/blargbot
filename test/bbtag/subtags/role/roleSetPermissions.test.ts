import { BBTagRuntimeError } from '@blargbot/bbtag';
import { RoleSetPermissionsSubtag } from '@blargbot/bbtag/subtags';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

await runSubtagTests({
    subtag: new RoleSetPermissionsSubtag(),
    argCountBounds: { min: 1, max: 3 },
    names: ['roleSetPermissions', 'roleSetPerms'],
    setup(ctx) {
        ctx.roles.authorizer.permissions = eris.Constants.Permissions.manageRoles.toString();
        ctx.members.authorizer.roles.push(ctx.roles.top.id);
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
                        ctx.discord.setup((m, $) => m.editRole(ctx.guild.id, role.id, $({ permissions: 0n }), 'Command User#0000'))
                            .resolves(role);
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
                        ctx.discord.setup((m, $) => m.editRole(ctx.guild.id, role.id, $({ permissions: 0n }), 'Command User#0000'))
                            .resolves(role);
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
                        ctx.discord.setup((m, $) => m.editRole(ctx.guild.id, role.id, $({ permissions: 0n }), 'Command User#0000'))
                            .resolves(role);
                    }
                },
                {
                    title: 'Author is admin',
                    expected: '',
                    setup(_, ctx) {
                        ctx.roles.authorizer.permissions = eris.Constants.Permissions.administrator.toString();
                    },
                    postSetup(role, _, ctx) {
                        ctx.discord.setup((m, $) => m.editRole(ctx.guild.id, role.id, $({ permissions: 239748n }), 'Command User#0000'))
                            .resolves(role);
                    }
                },
                {
                    title: 'Author has permissions',
                    expected: '',
                    setup(_, ctx) {
                        ctx.roles.authorizer.permissions = (eris.Constants.Permissions.all & ~eris.Constants.Permissions.administrator).toString();
                    },
                    postSetup(role, _, ctx) {
                        ctx.discord.setup((m, $) => m.editRole(ctx.guild.id, role.id, $({ permissions: 239748n }), 'Command User#0000'))
                            .resolves(role);
                    }
                },
                {
                    title: 'Author has partial permissions',
                    expected: '',
                    setup(_, ctx) {
                        ctx.roles.authorizer.permissions = (
                            eris.Constants.Permissions.manageRoles
                            | eris.Constants.Permissions.viewAuditLog
                            | eris.Constants.Permissions.readMessageHistory
                        ).toString();
                    },
                    postSetup(role, _, ctx) {
                        ctx.discord.setup((m, $) => m.editRole(ctx.guild.id, role.id, $({ permissions: 65664n }), 'Command User#0000'))
                            .resolves(role);
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
                ctx.roles.authorizer.permissions = '0';
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
                const role = bbctx.local.message.channel.guild.roles.get('3298746326924');
                if (role === undefined)
                    throw new Error('Unable to locate role under test');

                ctx.util.setup(m => m.findRoles(bbctx.local.message.channel.guild, '3298746326924'))
                    .resolves([role]);
            }
        },
        {
            code: '{rolesetperms;3298746326924}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Failed to edit role: no perms', 'Test REST error') }
            ],
            setup(ctx) {
                ctx.roles.bot.id = '3298746326924';
            },
            postSetup(bbctx, ctx) {
                const err = ctx.createRESTError(eris.ApiError.MISSING_PERMISSIONS);
                const role = bbctx.local.message.channel.guild.roles.get('3298746326924');
                if (role === undefined)
                    throw new Error('Unable to locate role under test');

                ctx.util.setup(m => m.findRoles(bbctx.local.message.channel.guild, '3298746326924'))
                    .resolves([role]);
                ctx.discord.setup((m, $) => m.editRole(ctx.guild.id, role.id, $({ permissions: 0n }), 'Command User#0000'))
                    .rejects(err);
            }
        },
        {
            code: '{rolesetperms;3298746326924}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Failed to edit role: no perms', 'Some other error message') }
            ],
            setup(ctx) {
                ctx.roles.bot.id = '3298746326924';
            },
            postSetup(bbctx, ctx) {
                const err = ctx.createRESTError(eris.ApiError.NOT_AUTHORIZED, 'Some other error message');
                const role = bbctx.local.message.channel.guild.roles.get('3298746326924');
                if (role === undefined)
                    throw new Error('Unable to locate role under test');

                ctx.util.setup(m => m.findRoles(bbctx.local.message.channel.guild, '3298746326924'))
                    .resolves([role]);
                ctx.discord.setup((m, $) => m.editRole(ctx.guild.id, role.id, $({ permissions: 0n }), 'Command User#0000'))
                    .rejects(err);
            }
        }
    ]
});
