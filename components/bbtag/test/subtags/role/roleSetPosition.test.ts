import { BBTagRuntimeError, NotANumberError, Subtag  } from '@blargbot/bbtag';
import { RoleSetPositionSubtag } from '@blargbot/bbtag/subtags';
import { argument } from '@blargbot/test-util/mock.js';
import * as Discord from 'discord-api-types/v10';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(RoleSetPositionSubtag),
    argCountBounds: { min: 2, max: 3 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.ManageRoles.toString();
        ctx.users.authorizer.member.roles.push(ctx.roles.top.id);
    },
    cases: [
        ...createGetRolePropTestCases({
            generateCode(role, ...args) {
                return `{${['rolesetpos', role, '0', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    postSetup(role, bbctx, ctx) {
                        ctx.roleService.setup(m => m.edit(bbctx, role.id, argument.isDeepEqual({ position: 0 }))).thenResolve(undefined);
                    }
                }
            ]
        }),
        ...createGetRolePropTestCases({
            generateCode(role, ...args) {
                return `{${['rolesetpos', role, '2', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    postSetup(role, bbctx, ctx) {
                        ctx.roleService.setup(m => m.edit(bbctx, role.id, argument.isDeepEqual({ position: 2 }))).thenResolve(undefined);
                    }
                }
            ]
        }),
        {
            code: '{rolesetpos;3298746326924;2}',
            expected: '`Author cannot edit roles`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Author cannot edit roles') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            }
        },
        {
            code: '{rolesetpos;3298746326924;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 30, error: new NotANumberError('abc') }
            ],
            postSetup(bbctx, ctx) {
                ctx.roleService.setup(m => m.querySingle(bbctx, '3298746326924', argument.isDeepEqual({ noLookup: false }))).thenResolve(ctx.roles.bot);
            }
        },
        {
            code: '{rolesetpos;3298746326924;2}',
            expected: '`Role above author`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Role above author') }
            ],
            postSetup(bbctx, ctx) {
                ctx.roleService.setup(m => m.querySingle(bbctx, '3298746326924', argument.isDeepEqual({ noLookup: false }))).thenResolve(ctx.roles.top);
            }
        },
        {
            code: '{rolesetpos;3298746326924;12}',
            expected: '`Desired position above author`',
            errors: [
                { start: 0, end: 29, error: new BBTagRuntimeError('Desired position above author') }
            ],
            postSetup(bbctx, ctx) {
                ctx.roleService.setup(m => m.querySingle(bbctx, '3298746326924', argument.isDeepEqual({ noLookup: false }))).thenResolve(ctx.roles.bot);
            }
        },
        {
            code: '{rolesetpos;3298746326924;2}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Failed to edit role: no perms', 'Test REST error') }
            ],
            postSetup(bbctx, ctx) {
                ctx.roleService.setup(m => m.querySingle(bbctx, '3298746326924', argument.isDeepEqual({ noLookup: false }))).thenResolve(ctx.roles.bot);
                ctx.roleService.setup(m => m.edit(bbctx, ctx.roles.bot.id, argument.isDeepEqual({ position: 2 }))).thenResolve({ error: 'Test REST error' });
            }
        },
        {
            code: '{rolesetpos;3298746326924;2}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Failed to edit role: no perms', 'Some other error message') }
            ],
            postSetup(bbctx, ctx) {
                ctx.roleService.setup(m => m.querySingle(bbctx, '3298746326924', argument.isDeepEqual({ noLookup: false }))).thenResolve(ctx.roles.bot);
                ctx.roleService.setup(m => m.edit(bbctx, ctx.roles.bot.id, argument.isDeepEqual({ position: 2 }))).thenResolve({ error: 'Some other error message' });
            }
        }
    ]
});
