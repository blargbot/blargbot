import type { Entities } from '@bbtag/blargbot';
import { BBTagRuntimeError } from '@bbtag/blargbot';
import { RoleCreateSubtag } from '@bbtag/blargbot/subtags';
import Discord from '@blargbot/discord-types';
import { argument } from '@blargbot/test-util/mock.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: RoleCreateSubtag,
    argCountBounds: { min: 1, max: 5 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = '-1';
    },
    cases: [
        {
            code: '{rolecreate;My role name}',
            expected: '982374624329846',
            postSetup(bbctx, ctx) {
                const expected = ctx.createMock<Entities.Role>();
                expected.setup(m => m.id).thenReturn('982374624329846');

                ctx.inject.roles.setup(m => m.create(bbctx.runtime, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0,
                    permissions: 0n,
                    mentionable: false,
                    hoist: false
                }))).thenResolve(expected.instance);
            }
        },
        {
            code: '{rolecreate;My role name;red}',
            expected: '982374624329846',
            postSetup(bbctx, ctx) {
                const expected = ctx.createMock<Entities.Role>();
                expected.setup(m => m.id).thenReturn('982374624329846');

                ctx.inject.roles.setup(m => m.create(bbctx.runtime, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0xff0000,
                    permissions: 0n,
                    mentionable: false,
                    hoist: false
                }))).thenResolve(expected.instance);
            }
        },
        {
            code: '{rolecreate;My role name;;238764}',
            expected: '982374624329846',
            postSetup(bbctx, ctx) {
                const expected = ctx.createMock<Entities.Role>();
                expected.setup(m => m.id).thenReturn('982374624329846');

                ctx.inject.roles.setup(m => m.create(bbctx.runtime, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0,
                    permissions: 238764n,
                    mentionable: false,
                    hoist: false
                }))).thenResolve(expected.instance);
            }
        },
        {
            code: '{rolecreate;My role name;blue;238764}',
            expected: '982374624329846',
            postSetup(bbctx, ctx) {
                const expected = ctx.createMock<Entities.Role>();
                expected.setup(m => m.id).thenReturn('982374624329846');

                ctx.inject.roles.setup(m => m.create(bbctx.runtime, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0x0000ff,
                    permissions: 238764n,
                    mentionable: false,
                    hoist: false
                }))).thenResolve(expected.instance);
            }
        },
        {
            code: '{rolecreate;My role name;blue;238764}',
            expected: '982374624329846',
            postSetup(bbctx, ctx) {
                const expected = ctx.createMock<Entities.Role>();
                expected.setup(m => m.id).thenReturn('982374624329846');

                ctx.inject.roles.setup(m => m.create(bbctx.runtime, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0x0000ff,
                    permissions: 238764n,
                    mentionable: false,
                    hoist: false
                }))).thenResolve(expected.instance);
            }
        },
        {
            code: '{rolecreate;My role name;;;true}',
            expected: '982374624329846',
            postSetup(bbctx, ctx) {
                const expected = ctx.createMock<Entities.Role>();
                expected.setup(m => m.id).thenReturn('982374624329846');

                ctx.inject.roles.setup(m => m.create(bbctx.runtime, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0,
                    permissions: 0n,
                    mentionable: true,
                    hoist: false
                }))).thenResolve(expected.instance);
            }
        },
        {
            code: '{rolecreate;My role name;;;false}',
            expected: '982374624329846',
            postSetup(bbctx, ctx) {
                const expected = ctx.createMock<Entities.Role>();
                expected.setup(m => m.id).thenReturn('982374624329846');

                ctx.inject.roles.setup(m => m.create(bbctx.runtime, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0,
                    permissions: 0n,
                    mentionable: false,
                    hoist: false
                }))).thenResolve(expected.instance);
            }
        },
        {
            code: '{rolecreate;My role name;;;;true}',
            expected: '982374624329846',
            postSetup(bbctx, ctx) {
                const expected = ctx.createMock<Entities.Role>();
                expected.setup(m => m.id).thenReturn('982374624329846');

                ctx.inject.roles.setup(m => m.create(bbctx.runtime, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0,
                    permissions: 0n,
                    mentionable: false,
                    hoist: true
                }))).thenResolve(expected.instance);
            }
        },
        {
            code: '{rolecreate;My role name;;;;false}',
            expected: '982374624329846',
            postSetup(bbctx, ctx) {
                const expected = ctx.createMock<Entities.Role>();
                expected.setup(m => m.id).thenReturn('982374624329846');

                ctx.inject.roles.setup(m => m.create(bbctx.runtime, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0,
                    permissions: 0n,
                    mentionable: false,
                    hoist: false
                }))).thenResolve(expected.instance);
            }
        },
        {
            code: '{rolecreate;My role name;red;3297864;true;true}',
            expected: '982374624329846',
            postSetup(bbctx, ctx) {
                const expected = ctx.createMock<Entities.Role>();
                expected.setup(m => m.id).thenReturn('982374624329846');

                ctx.inject.roles.setup(m => m.create(bbctx.runtime, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0xff0000,
                    permissions: 3297864n,
                    mentionable: true,
                    hoist: true
                }))).thenResolve(expected.instance);
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
                    -1n
                    & ~Discord.PermissionFlagsBits.Administrator
                    & ~Discord.PermissionFlagsBits.ManageRoles
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
                ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.ManageRoles.toString();
            }
        },
        {
            code: '{rolecreate;My role name;red;3297864;true;true}',
            expected: '`Failed to create role: no perms`',
            errors: [
                { start: 0, end: 47, error: new BBTagRuntimeError('Failed to create role: no perms', 'Test REST error') }
            ],
            postSetup(bbctx, ctx) {
                ctx.inject.roles.setup(m => m.create(bbctx.runtime, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0xff0000,
                    permissions: 3297864n,
                    mentionable: true,
                    hoist: true
                }))).thenResolve({ error: 'Test REST error' });
            }
        },
        {
            code: '{rolecreate;My role name;red;3297864;true;true}',
            expected: '`Failed to create role: no perms`',
            errors: [
                { start: 0, end: 47, error: new BBTagRuntimeError('Failed to create role: no perms', 'Some other error message') }
            ],
            postSetup(bbctx, ctx) {
                ctx.inject.roles.setup(m => m.create(bbctx.runtime, argument.isDeepEqual({
                    name: 'My role name',
                    color: 0xff0000,
                    permissions: 3297864n,
                    mentionable: true,
                    hoist: true
                }))).thenResolve({ error: 'Some other error message' });
            }
        }
    ]
});
