import { BBTagRuntimeError } from '@bbtag/blargbot';
import { RoleSetPermissionsSubtag } from '@bbtag/blargbot/subtags';
import Discord from '@blargbot/discord-types';
import { argument } from '@blargbot/test-util/mock.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

runSubtagTests({
    subtag: RoleSetPermissionsSubtag,
    argCountBounds: { min: 1, max: 3 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.ManageRoles.toString();
        ctx.users.authorizer.member.roles.push(ctx.roles.top.id);
    },
    cases: [
        ...createGetRolePropTestCases({
            quiet: false,
            generateCode(role, ...args) {
                return `{${['rolesetperms', role, ...args].join(';')}}`;
            },
            notFound: () => new BBTagRuntimeError('Role not found'),
            getQueryOptions: () => ({ noLookup: false }),
            cases: [
                {
                    expected: '',
                    postSetup(role, bbctx, ctx) {
                        ctx.inject.roles.setup(m => m.edit(bbctx.runtime, role.id, argument.isDeepEqual({ permissions: '0' }))).thenResolve(undefined);
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
            getQueryOptions: () => ({ noLookup: false }),
            cases: [
                {
                    expected: '',
                    postSetup(role, bbctx, ctx) {
                        ctx.inject.roles.setup(m => m.edit(bbctx.runtime, role.id, argument.isDeepEqual({ permissions: '0' }))).thenResolve(undefined);
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
                    postSetup(role, bbctx, ctx) {
                        ctx.inject.roles.setup(m => m.edit(bbctx.runtime, role.id, argument.isDeepEqual({ permissions: '0' }))).thenResolve(undefined);
                    }
                },
                {
                    title: 'Author is admin',
                    expected: '',
                    setup(_, ctx) {
                        ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.Administrator.toString();
                    },
                    postSetup(role, bbctx, ctx) {
                        ctx.inject.roles.setup(m => m.edit(bbctx.runtime, role.id, argument.isDeepEqual({ permissions: '239748' }))).thenResolve(undefined);
                    }
                },
                {
                    title: 'Author has permissions',
                    expected: '',
                    setup(_, ctx) {
                        ctx.roles.authorizer.permissions = (-1n & ~Discord.PermissionFlagsBits.Administrator).toString();
                    },
                    postSetup(role, bbctx, ctx) {
                        ctx.inject.roles.setup(m => m.edit(bbctx.runtime, role.id, argument.isDeepEqual({ permissions: '239748' }))).thenResolve(undefined);
                    }
                },
                {
                    title: 'Author has partial permissions',
                    expected: '',
                    setup(_, ctx) {
                        ctx.roles.authorizer.permissions = (
                            Discord.PermissionFlagsBits.ManageRoles
                            | Discord.PermissionFlagsBits.ViewAuditLog
                            | Discord.PermissionFlagsBits.ReadMessageHistory
                        ).toString();
                    },
                    postSetup(role, bbctx, ctx) {
                        ctx.inject.roles.setup(m => m.edit(bbctx.runtime, role.id, argument.isDeepEqual({ permissions: '65664' }))).thenResolve(undefined);
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
            postSetup(bbctx, ctx) {
                ctx.inject.roles.setup(m => m.querySingle(bbctx.runtime, '3298746326924', argument.isDeepEqual({ noLookup: false }))).thenResolve(ctx.roles.top);
            }
        },
        {
            code: '{rolesetperms;3298746326924}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Failed to edit role: no perms', 'Test REST error') }
            ],
            postSetup(bbctx, ctx) {
                ctx.inject.roles.setup(m => m.querySingle(bbctx.runtime, '3298746326924', argument.isDeepEqual({ noLookup: false }))).thenResolve(ctx.roles.bot);
                ctx.inject.roles.setup(m => m.edit(bbctx.runtime, ctx.roles.bot.id, argument.isDeepEqual({ permissions: '0' }))).thenResolve({ error: 'Test REST error' });
            }
        },
        {
            code: '{rolesetperms;3298746326924}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Failed to edit role: no perms', 'Some other error message') }
            ],
            postSetup(bbctx, ctx) {
                ctx.inject.roles.setup(m => m.querySingle(bbctx.runtime, '3298746326924', argument.isDeepEqual({ noLookup: false }))).thenResolve(ctx.roles.bot);
                ctx.inject.roles.setup(m => m.edit(bbctx.runtime, ctx.roles.bot.id, argument.isDeepEqual({ permissions: '0' }))).thenResolve({ error: 'Some other error message' });
            }
        }
    ]
});
