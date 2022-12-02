import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { RoleCreateSubtag } from '@blargbot/bbtag/subtags/role/roleCreate.js';
import { argument } from '@blargbot/test-util/mock.js';
import * as Eris from 'eris';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new RoleCreateSubtag(),
    argCountBounds: { min: 1, max: 5 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = Eris.Constants.Permissions.all.toString();
    },
    cases: [
        {
            code: '{rolecreate;My role name}',
            expected: '982374624329846',
            postSetup(bbctx, ctx) {
                const expected = ctx.createRole(bbctx.guild, SubtagTestContext.createApiRole({
                    id: '982374624329846'
                }));

                ctx.discord.setup(m => m.createRole(ctx.guild.id, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0,
                    permissions: 0n,
                    mentionable: false,
                    hoist: false
                }), 'Command User#0000')).thenResolve(expected);
            }
        },
        {
            code: '{rolecreate;My role name;red}',
            expected: '982374624329846',
            postSetup(bbctx, ctx) {
                const expected = ctx.createRole(bbctx.guild, SubtagTestContext.createApiRole({
                    id: '982374624329846'
                }));

                ctx.discord.setup(m => m.createRole(ctx.guild.id, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0xff0000,
                    permissions: 0n,
                    mentionable: false,
                    hoist: false
                }), 'Command User#0000')).thenResolve(expected);
            }
        },
        {
            code: '{rolecreate;My role name;;238764}',
            expected: '982374624329846',
            postSetup(bbctx, ctx) {
                const expected = ctx.createRole(bbctx.guild, SubtagTestContext.createApiRole({
                    id: '982374624329846'
                }));

                ctx.discord.setup(m => m.createRole(ctx.guild.id, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0,
                    permissions: 238764n,
                    mentionable: false,
                    hoist: false
                }), 'Command User#0000')).thenResolve(expected);
            }
        },
        {
            code: '{rolecreate;My role name;blue;238764}',
            expected: '982374624329846',
            postSetup(bbctx, ctx) {
                const expected = ctx.createRole(bbctx.guild, SubtagTestContext.createApiRole({
                    id: '982374624329846'
                }));

                ctx.discord.setup(m => m.createRole(ctx.guild.id, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0x0000ff,
                    permissions: 238764n,
                    mentionable: false,
                    hoist: false
                }), 'Command User#0000')).thenResolve(expected);
            }
        },
        {
            code: '{rolecreate;My role name;blue;238764}',
            expected: '982374624329846',
            postSetup(bbctx, ctx) {
                const expected = ctx.createRole(bbctx.guild, SubtagTestContext.createApiRole({
                    id: '982374624329846'
                }));

                ctx.discord.setup(m => m.createRole(ctx.guild.id, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0x0000ff,
                    permissions: 238764n,
                    mentionable: false,
                    hoist: false
                }), 'Command User#0000')).thenResolve(expected);
            }
        },
        {
            code: '{rolecreate;My role name;;;true}',
            expected: '982374624329846',
            postSetup(bbctx, ctx) {
                const expected = ctx.createRole(bbctx.guild, SubtagTestContext.createApiRole({
                    id: '982374624329846'
                }));

                ctx.discord.setup(m => m.createRole(ctx.guild.id, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0,
                    permissions: 0n,
                    mentionable: true,
                    hoist: false
                }), 'Command User#0000')).thenResolve(expected);
            }
        },
        {
            code: '{rolecreate;My role name;;;false}',
            expected: '982374624329846',
            postSetup(bbctx, ctx) {
                const expected = ctx.createRole(bbctx.guild, SubtagTestContext.createApiRole({
                    id: '982374624329846'
                }));

                ctx.discord.setup(m => m.createRole(ctx.guild.id, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0,
                    permissions: 0n,
                    mentionable: false,
                    hoist: false
                }), 'Command User#0000')).thenResolve(expected);
            }
        },
        {
            code: '{rolecreate;My role name;;;;true}',
            expected: '982374624329846',
            postSetup(bbctx, ctx) {
                const expected = ctx.createRole(bbctx.guild, SubtagTestContext.createApiRole({
                    id: '982374624329846'
                }));

                ctx.discord.setup(m => m.createRole(ctx.guild.id, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0,
                    permissions: 0n,
                    mentionable: false,
                    hoist: true
                }), 'Command User#0000')).thenResolve(expected);
            }
        },
        {
            code: '{rolecreate;My role name;;;;false}',
            expected: '982374624329846',
            postSetup(bbctx, ctx) {
                const expected = ctx.createRole(bbctx.guild, SubtagTestContext.createApiRole({
                    id: '982374624329846'
                }));

                ctx.discord.setup(m => m.createRole(ctx.guild.id, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0,
                    permissions: 0n,
                    mentionable: false,
                    hoist: false
                }), 'Command User#0000')).thenResolve(expected);
            }
        },
        {
            code: '{rolecreate;My role name;red;3297864;true;true}',
            expected: '982374624329846',
            postSetup(bbctx, ctx) {
                const expected = ctx.createRole(bbctx.guild, SubtagTestContext.createApiRole({
                    id: '982374624329846'
                }));

                ctx.discord.setup(m => m.createRole(ctx.guild.id, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0xff0000,
                    permissions: 3297864n,
                    mentionable: true,
                    hoist: true
                }), 'Command User#0000')).thenResolve(expected);
            }
        },
        {
            code: '{rolecreate;My role name;red;3297864;true;true}',
            expected: '`Author cannot create roles`',
            errors: [
                { start: 0, end: 47, error: new BBTagRuntimeError('Author cannot create roles') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = (
                    Eris.Constants.Permissions.all
                    & ~Eris.Constants.Permissions.administrator
                    & ~Eris.Constants.Permissions.manageRoles
                ).toString();
            }
        },
        {
            code: '{rolecreate;My role name;red;abc;true;true}',
            expected: '`Permission not a number`',
            errors: [
                { start: 0, end: 43, error: new BBTagRuntimeError('Permission not a number', '"abc" is not a number') }
            ]
        },
        {
            code: '{rolecreate;My role name;red;3297864;true;true}',
            expected: '`Author missing requested permissions`',
            errors: [
                { start: 0, end: 47, error: new BBTagRuntimeError('Author missing requested permissions') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = Eris.Constants.Permissions.manageRoles.toString();
            }
        },
        {
            code: '{rolecreate;My role name;red;3297864;true;true}',
            expected: '`Failed to create role: no perms`',
            errors: [
                { start: 0, end: 47, error: new BBTagRuntimeError('Failed to create role: no perms', 'Test REST error') }
            ],
            setup(ctx) {
                const err = ctx.createRESTError(Eris.ApiError.MISSING_PERMISSIONS);
                ctx.discord.setup(m => m.createRole(ctx.guild.id, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0xff0000,
                    permissions: 3297864n,
                    mentionable: true,
                    hoist: true
                }), 'Command User#0000')).thenReject(err);
            }
        },
        {
            code: '{rolecreate;My role name;red;3297864;true;true}',
            expected: '`Failed to create role: no perms`',
            errors: [
                { start: 0, end: 47, error: new BBTagRuntimeError('Failed to create role: no perms', 'Some other error message') }
            ],
            setup(ctx) {
                const err = ctx.createRESTError(Eris.ApiError.NOT_AUTHORIZED, 'Some other error message');
                ctx.discord.setup(m => m.createRole(ctx.guild.id, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0xff0000,
                    permissions: 3297864n,
                    mentionable: true,
                    hoist: true
                }), 'Command User#0000')).thenReject(err);
            }
        }
    ]
});
