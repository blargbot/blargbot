import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.roleCreateReplacerFactory({
        getColorByName(v) {
            switch (v) {
                case 'red': return 0xFF0000;
                case 'blue': return 0x0000FF;
                default: return null;
            }
        }
    }),
    names: ['roleCreate'],
    argCountBounds: { min: 1, max: 5 },
    setup(ctx) {
        ctx.discord.setup(m => m.authorPermissions).returns(~0n, { isFallback: true });
    },
    cases: [
        {
            code: '{rolecreate;My role name}',
            expected: '982374624329846',
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([32946298746234n]).mustHappen(1);
                ctx.discord.setup((m, $) => m.createRole($({
                    name: 'My role name',
                    color: 0,
                    permissions: 0n,
                    mentionable: false,
                    hoist: false
                }))).resolves(982374624329846n).mustHappen(1);
            }
        },
        {
            code: '{rolecreate;My role name;red}',
            expected: '982374624329846',
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([32946298746234n]).mustHappen(1);
                ctx.discord.setup((m, $) => m.createRole($({
                    name: 'My role name',
                    color: 0xff0000,
                    permissions: 0n,
                    mentionable: false,
                    hoist: false
                }))).resolves(982374624329846n).mustHappen(1);
            }
        },
        {
            code: '{rolecreate;My role name;;238764}',
            expected: '982374624329846',
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([32946298746234n]).mustHappen(1);
                ctx.discord.setup((m, $) => m.createRole($({
                    name: 'My role name',
                    color: 0,
                    permissions: 238764n,
                    mentionable: false,
                    hoist: false
                }))).resolves(982374624329846n).mustHappen(1);
            }
        },
        {
            code: '{rolecreate;My role name;blue;238764}',
            expected: '982374624329846',
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([32946298746234n]).mustHappen(1);
                ctx.discord.setup((m, $) => m.createRole($({
                    name: 'My role name',
                    color: 0x0000FF,
                    permissions: 238764n,
                    mentionable: false,
                    hoist: false
                }))).resolves(982374624329846n).mustHappen(1);
            }
        },
        {
            code: '{rolecreate;My role name;;;true}',
            expected: '982374624329846',
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([32946298746234n]).mustHappen(1);
                ctx.discord.setup((m, $) => m.createRole($({
                    name: 'My role name',
                    color: 0,
                    permissions: 0n,
                    mentionable: true,
                    hoist: false
                }))).resolves(982374624329846n).mustHappen(1);
            }
        },
        {
            code: '{rolecreate;My role name;;;false}',
            expected: '982374624329846',
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([32946298746234n]).mustHappen(1);
                ctx.discord.setup((m, $) => m.createRole($({
                    name: 'My role name',
                    color: 0,
                    permissions: 0n,
                    mentionable: false,
                    hoist: false
                }))).resolves(982374624329846n).mustHappen(1);
            }
        },
        {
            code: '{rolecreate;My role name;;;;true}',
            expected: '982374624329846',
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([32946298746234n]).mustHappen(1);
                ctx.discord.setup((m, $) => m.createRole($({
                    name: 'My role name',
                    color: 0,
                    permissions: 0n,
                    mentionable: false,
                    hoist: true
                }))).resolves(982374624329846n).mustHappen(1);
            }
        },
        {
            code: '{rolecreate;My role name;;;;false}',
            expected: '982374624329846',
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([32946298746234n]).mustHappen(1);
                ctx.discord.setup((m, $) => m.createRole($({
                    name: 'My role name',
                    color: 0,
                    permissions: 0n,
                    mentionable: false,
                    hoist: false
                }))).resolves(982374624329846n).mustHappen(1);
            }
        },
        {
            code: '{rolecreate;My role name;red;3297864;true;true}',
            expected: '982374624329846',
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([32946298746234n]).mustHappen(1);
                ctx.discord.setup((m, $) => m.createRole($({
                    name: 'My role name',
                    color: 0xFF0000,
                    permissions: 3297864n,
                    mentionable: true,
                    hoist: true
                }))).resolves(982374624329846n).mustHappen(1);
            }
        },
        {
            code: '{rolecreate;My role name;red;3297864;true;true}',
            expected: '`Author cannot create roles`',
            errors: [
                { start: 0, end: 47, error: new BBTagRuntimeError('Author cannot create roles') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([]).mustHappen(1);
            }
        },
        {
            code: '{rolecreate;My role name;red;abc;true;true}',
            expected: '`Permission not a number`',
            errors: [
                { start: 0, end: 43, error: new BBTagRuntimeError('Permission not a number', '"abc" is not a number') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([32946298746234n]).mustHappen(1);
            }
        },
        {
            code: '{rolecreate;My role name;red;3297864;true;true}',
            expected: '`Author missing requested permissions`',
            errors: [
                { start: 0, end: 47, error: new BBTagRuntimeError('Author missing requested permissions') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([32946298746234n]).mustHappen(1);
                ctx.discord.setup(m => m.authorPermissions).returns(0n).mustHappen(1);
            }
        },
        {
            code: '{rolecreate;My role name;red;3297864;true;true}',
            expected: '`Failed to create role: no perms`',
            errors: [
                { start: 0, end: 47, error: new BBTagRuntimeError('Failed to create role: no perms') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([32946298746234n]).mustHappen(1);
                ctx.discord.setup((m, $) => m.createRole($({
                    name: 'My role name',
                    color: 0xFF0000,
                    permissions: 3297864n,
                    mentionable: true,
                    hoist: true
                }))).resolves(null).mustHappen(1);
            }
        }
    ]
});
