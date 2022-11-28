import { BBTagRuntimeError } from '@blargbot/bbtag/errors';
import { RoleSetColorSubtag } from '@blargbot/bbtag/subtags/role/roleSetColor';
import { argument } from '@blargbot/test-util/mock';
import { ApiError, Constants } from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetRolePropTestCases } from './_getRolePropTest';

runSubtagTests({
    subtag: new RoleSetColorSubtag(),
    argCountBounds: { min: 1, max: 3 },
    setup(ctx) {
        ctx.roles.authorizer.permissions = Constants.Permissions.manageRoles.toString();
        ctx.members.authorizer.roles.push(ctx.roles.top.id);
    },
    cases: [
        ...createGetRolePropTestCases({
            quiet: false,
            generateCode(...args) {
                return `{${['rolesetcolor', ...args].join(';')}}`;
            },
            notFound: () => new BBTagRuntimeError('Role not found'),
            cases: [
                {
                    expected: '',
                    postSetup(role, _, ctx) {
                        ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ color: 0 }), 'Command User#0000'))
                            .thenResolve(role);
                    }
                }
            ]
        }),
        ...[
            { text: '', color: 0x000000 },
            { text: 'this isnt a valid color', color: undefined },
            { text: 'red', color: 0xff0000 },
            { text: 'green', color: 0x008001 },
            { text: 'blue', color: 0x0000ff }
        ].flatMap(({ text, color }) => createGetRolePropTestCases({
            generateCode(role, ...args) {
                return `{${['rolesetcolor', role, text, ...args].join(';')}}`;
            },
            notFound: () => new BBTagRuntimeError('Role not found'),
            cases: [
                {
                    expected: '',
                    postSetup(role, _, ctx) {
                        ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ color: color }), 'Command User#0000'))
                            .thenResolve(role);
                    }
                }
            ]
        })),
        {
            code: '{rolesetcolor;3298746326924}',
            expected: '`Author cannot edit roles`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Author cannot edit roles') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            }
        },
        {
            code: '{rolesetcolor;3298746326924}',
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
            code: '{rolesetcolor;3298746326924}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Failed to edit role: no perms', 'Test REST error') }
            ],
            setup(ctx) {
                ctx.roles.other.id = '3298746326924';
            },
            postSetup(bbctx, ctx) {
                const err = ctx.createRESTError(ApiError.MISSING_PERMISSIONS);
                const role = bbctx.guild.roles.get('3298746326924');
                if (role === undefined)
                    throw new Error('Unable to locate role under test');

                ctx.util.setup(m => m.findRoles(bbctx.guild, '3298746326924'))
                    .thenResolve([role]);
                ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ color: 0 }), 'Command User#0000'))
                    .thenReject(err);
            }
        },
        {
            code: '{rolesetcolor;3298746326924}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Failed to edit role: no perms', 'Some other error message') }
            ],
            setup(ctx) {
                ctx.roles.other.id = '3298746326924';
            },
            postSetup(bbctx, ctx) {
                const err = ctx.createRESTError(ApiError.NOT_AUTHORIZED, 'Some other error message');
                const role = bbctx.guild.roles.get('3298746326924');
                if (role === undefined)
                    throw new Error('Unable to locate role under test');

                ctx.util.setup(m => m.findRoles(bbctx.guild, '3298746326924'))
                    .thenResolve([role]);
                ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ color: 0 }), 'Command User#0000'))
                    .thenReject(err);
            }
        }
    ]
});
