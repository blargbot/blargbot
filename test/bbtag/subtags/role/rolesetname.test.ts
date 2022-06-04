import { BBTagRuntimeError } from '@blargbot/bbtag/errors';
import { RoleSetNameSubtag } from '@blargbot/bbtag/subtags/role/rolesetname';
import { ApiError, Constants } from 'eris';

import { argument } from '../../mock';
import { runSubtagTests } from '../SubtagTestSuite';
import { createGetRolePropTestCases } from './_getRolePropTest';

runSubtagTests({
    subtag: new RoleSetNameSubtag(),
    argCountBounds: { min: 2, max: 3 },
    setup(ctx) {
        ctx.roles.command.permissions = Constants.Permissions.manageRoles.toString();
        ctx.members.command.roles.push(ctx.roles.top.id);
    },
    cases: [
        ...createGetRolePropTestCases({
            generateCode(role, ...args) {
                return `{${['rolesetname', role, 'New name!', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '',
                    postSetup(role, _, ctx) {
                        ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ name: 'New name!' }), 'Command User#0000'))
                            .thenResolve(role);
                    }
                }
            ]
        }),
        {
            code: '{rolesetname;3298746326924;New name!}',
            expected: '`Author cannot edit roles`',
            errors: [
                { start: 0, end: 37, error: new BBTagRuntimeError('Author cannot edit roles') }
            ],
            setup(ctx) {
                ctx.roles.command.permissions = '0';
            }
        },
        {
            code: '{rolesetname;3298746326924;New name!}',
            expected: '`Role above author`',
            errors: [
                { start: 0, end: 37, error: new BBTagRuntimeError('Role above author') }
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
            code: '{rolesetname;3298746326924;New name!}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 37, error: new BBTagRuntimeError('Failed to edit role: no perms', 'Test REST error') }
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
                ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ name: 'New name!' }), 'Command User#0000'))
                    .thenReject(err);
            }
        },
        {
            code: '{rolesetname;3298746326924;New name!}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 37, error: new BBTagRuntimeError('Failed to edit role: no perms', 'Some other error message') }
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
                ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, argument.isDeepEqual({ name: 'New name!' }), 'Command User#0000'))
                    .thenReject(err);
            }
        }
    ]
});
