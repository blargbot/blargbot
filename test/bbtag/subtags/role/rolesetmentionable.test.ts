import { BBTagRuntimeError } from '@blargbot/bbtag/errors';
import { RoleSetMentionableSubtag } from '@blargbot/bbtag/subtags/role/rolesetmentionable';
import { argument } from '@blargbot/test-util/mock';
import { ApiError, Constants } from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetRolePropTestCases } from './_getRolePropTest';

runSubtagTests({
    subtag: new RoleSetMentionableSubtag(),
    argCountBounds: { min: 1, max: 3 },
    setup(ctx) {
        ctx.roles.authorizer.permissions = Constants.Permissions.manageRoles.toString();
        ctx.members.authorizer.roles.push(ctx.roles.top.id);
    },
    cases: [
        ...createGetRolePropTestCases({
            quiet: false,
            generateCode(role, ...args) {
                return `{${['rolesetmentionable', role, 'true', ...args].join(';')}}`;
            },
            notFound: () => new BBTagRuntimeError('Role not found'),
            cases: [
                {
                    expected: '',
                    postSetup(role, _, ctx) {
                        ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ mentionable: true }), 'Command User#0000'))
                            .thenResolve(role);
                    }
                }
            ]
        }),
        ...createGetRolePropTestCases({
            quiet: false,
            generateCode(role, ...args) {
                return `{${['rolesetmentionable', role, 'false', ...args].join(';')}}`;
            },
            notFound: () => new BBTagRuntimeError('Role not found'),
            cases: [
                {
                    expected: '',
                    postSetup(role, _, ctx) {
                        ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ mentionable: false }), 'Command User#0000'))
                            .thenResolve(role);
                    }
                }
            ]
        }),
        ...createGetRolePropTestCases({
            generateCode(role, ...args) {
                return `{${['rolesetmentionable', role, 'true', ...args].join(';')}}`;
            },
            notFound: () => new BBTagRuntimeError('Role not found'),
            cases: [
                {
                    expected: '',
                    postSetup(role, _, ctx) {
                        ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ mentionable: true }), 'Command User#0000'))
                            .thenResolve(role);
                    }
                }
            ]
        }),
        ...createGetRolePropTestCases({
            generateCode(role, ...args) {
                return `{${['rolesetmentionable', role, '', ...args].join(';')}}`;
            },
            notFound: () => new BBTagRuntimeError('Role not found'),
            cases: [
                {
                    expected: '',
                    postSetup(role, _, ctx) {
                        ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ mentionable: true }), 'Command User#0000'))
                            .thenResolve(role);
                    }
                }
            ]
        }),
        ...createGetRolePropTestCases({
            generateCode(role, ...args) {
                return `{${['rolesetmentionable', role, 'false', ...args].join(';')}}`;
            },
            notFound: () => new BBTagRuntimeError('Role not found'),
            cases: [
                {
                    expected: '',
                    postSetup(role, _, ctx) {
                        ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ mentionable: false }), 'Command User#0000'))
                            .thenResolve(role);
                    }
                }
            ]
        }),
        {
            code: '{rolesetmentionable;3298746326924}',
            expected: '`Author cannot edit roles`',
            errors: [
                { start: 0, end: 34, error: new BBTagRuntimeError('Author cannot edit roles') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            }
        },
        {
            code: '{rolesetmentionable;3298746326924}',
            expected: '`Role above author`',
            errors: [
                { start: 0, end: 34, error: new BBTagRuntimeError('Role above author') }
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
            code: '{rolesetmentionable;3298746326924}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 34, error: new BBTagRuntimeError('Failed to edit role: no perms', 'Test REST error') }
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
                ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ mentionable: true }), 'Command User#0000'))
                    .thenReject(err);
            }
        },
        {
            code: '{rolesetmentionable;3298746326924}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 34, error: new BBTagRuntimeError('Failed to edit role: no perms', 'Some other error message') }
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
                ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ mentionable: true }), 'Command User#0000'))
                    .thenReject(err);
            }
        }
    ]
});
