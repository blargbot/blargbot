import { BBTagRuntimeError } from '@blargbot/bbtag';
import { RoleSetMentionableSubtag } from '@blargbot/bbtag/subtags';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

await runSubtagTests({
    subtag: new RoleSetMentionableSubtag(),
    argCountBounds: { min: 1, max: 3 },
    names: ['roleSetMentionable'],
    setup(ctx) {
        ctx.roles.authorizer.permissions = eris.Constants.Permissions.manageRoles.toString();
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
                        ctx.discord.setup((m, $) => m.editRole(ctx.guild.id, role.id, $({ mentionable: true }), 'Command User#0000'))
                            .resolves(role);
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
                        ctx.discord.setup((m, $) => m.editRole(ctx.guild.id, role.id, $({ mentionable: false }), 'Command User#0000'))
                            .resolves(role);
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
                        ctx.discord.setup((m, $) => m.editRole(ctx.guild.id, role.id, $({ mentionable: true }), 'Command User#0000'))
                            .resolves(role);
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
                        ctx.discord.setup((m, $) => m.editRole(ctx.guild.id, role.id, $({ mentionable: true }), 'Command User#0000'))
                            .resolves(role);
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
                        ctx.discord.setup((m, $) => m.editRole(ctx.guild.id, role.id, $({ mentionable: false }), 'Command User#0000'))
                            .resolves(role);
                    }
                }
            ]
        }),
        {
            code: '{rolesetmentionable;3298746326924}',
            expected: '`Author cannot edit roles`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot edit roles') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            }
        },
        {
            code: '{rolesetmentionable;3298746326924}',
            expected: '`Role above author`',
            errors: [
                { error: new BBTagRuntimeError('Role above author') }
            ],
            setup(ctx) {
                ctx.roles.top.id = '3298746326924';
            },
            postSetup(bbctx, ctx) {
                const role = bbctx.root.message.channel.guild.roles.get('3298746326924');
                if (role === undefined)
                    throw new Error('Unable to locate role under test');

                ctx.util.setup(m => m.findRoles(bbctx.root.message.channel.guild, '3298746326924'))
                    .resolves([role]);
            }
        },
        {
            code: '{rolesetmentionable;3298746326924}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { error: new BBTagRuntimeError('Failed to edit role: no perms', 'Test REST error') }
            ],
            setup(ctx) {
                ctx.roles.bot.id = '3298746326924';
            },
            postSetup(bbctx, ctx) {
                const err = ctx.createRESTError(eris.ApiError.MISSING_PERMISSIONS);
                const role = bbctx.root.message.channel.guild.roles.get('3298746326924');
                if (role === undefined)
                    throw new Error('Unable to locate role under test');

                ctx.util.setup(m => m.findRoles(bbctx.root.message.channel.guild, '3298746326924'))
                    .resolves([role]);
                ctx.discord.setup((m, $) => m.editRole(ctx.guild.id, role.id, $({ mentionable: true }), 'Command User#0000'))
                    .rejects(err);
            }
        },
        {
            code: '{rolesetmentionable;3298746326924}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { error: new BBTagRuntimeError('Failed to edit role: no perms', 'Some other error message') }
            ],
            setup(ctx) {
                ctx.roles.bot.id = '3298746326924';
            },
            postSetup(bbctx, ctx) {
                const err = ctx.createRESTError(eris.ApiError.NOT_AUTHORIZED, 'Some other error message');
                const role = bbctx.root.message.channel.guild.roles.get('3298746326924');
                if (role === undefined)
                    throw new Error('Unable to locate role under test');

                ctx.util.setup(m => m.findRoles(bbctx.root.message.channel.guild, '3298746326924'))
                    .resolves([role]);
                ctx.discord.setup((m, $) => m.editRole(ctx.guild.id, role.id, $({ mentionable: true }), 'Command User#0000'))
                    .rejects(err);
            }
        }
    ]
});
