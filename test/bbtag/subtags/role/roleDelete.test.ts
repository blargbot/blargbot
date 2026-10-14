import { BBTagRuntimeError } from '@blargbot/bbtag';
import { RoleDeleteSubtag } from '@blargbot/bbtag/subtags';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

await runSubtagTests({
    subtag: new RoleDeleteSubtag(),
    argCountBounds: { min: 1, max: 2 },
    names: ['roleDelete'],
    setup(ctx) {
        ctx.roles.authorizer.permissions = eris.Constants.Permissions.manageRoles.toString();
        ctx.members.authorizer.roles.push(ctx.roles.top.id);
    },
    cases: [
        ...createGetRolePropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['roledelete', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '',
                    setup(role, ctx) {
                        ctx.discord.setup(m => m.deleteRole(ctx.guild.id, role.id, 'Command User#0000')).resolves(undefined);
                    }
                }
            ]
        }),
        {
            code: '{roledelete;3298746326924}',
            expected: '`Author cannot delete roles`',
            errors: [
                { start: 0, end: 26, error: new BBTagRuntimeError('Author cannot delete roles') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            }
        },
        {
            code: '{roledelete;3298746326924}',
            expected: '`Role above author`',
            errors: [
                { start: 0, end: 26, error: new BBTagRuntimeError('Role above author') }
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
            code: '{roledelete;3298746326924}',
            expected: '`Failed to delete role: no perms`',
            errors: [
                { start: 0, end: 26, error: new BBTagRuntimeError('Failed to delete role: no perms', 'Test REST error') }
            ],
            setup(ctx) {
                ctx.roles.other.id = '3298746326924';
            },
            postSetup(bbctx, ctx) {
                const err = ctx.createRESTError(eris.ApiError.MISSING_PERMISSIONS);
                const role = bbctx.local.message.channel.guild.roles.get('3298746326924');
                if (role === undefined)
                    throw new Error('Unable to locate role under test');

                ctx.util.setup(m => m.findRoles(bbctx.local.message.channel.guild, '3298746326924'))
                    .resolves([role]);
                ctx.discord.setup(m => m.deleteRole(ctx.guild.id, role.id, 'Command User#0000'))
                    .rejects(err);
            }
        },
        {
            code: '{roledelete;3298746326924}',
            expected: '`Failed to delete role: no perms`',
            errors: [
                { start: 0, end: 26, error: new BBTagRuntimeError('Failed to delete role: no perms', 'Some other error message') }
            ],
            setup(ctx) {
                ctx.roles.other.id = '3298746326924';
            },
            postSetup(bbctx, ctx) {
                const err = ctx.createRESTError(eris.ApiError.NOT_AUTHORIZED, 'Some other error message');
                const role = bbctx.local.message.channel.guild.roles.get('3298746326924');
                if (role === undefined)
                    throw new Error('Unable to locate role under test');

                ctx.util.setup(m => m.findRoles(bbctx.local.message.channel.guild, '3298746326924'))
                    .resolves([role]);
                ctx.discord.setup(m => m.deleteRole(ctx.guild.id, role.id, 'Command User#0000'))
                    .rejects(err);
            }
        }
    ]
});
