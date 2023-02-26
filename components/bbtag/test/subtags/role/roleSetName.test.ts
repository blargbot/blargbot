import { BBTagRuntimeError, Subtag } from '@bbtag/blargbot';
import { RoleSetNameSubtag } from '@bbtag/blargbot/subtags';
import Discord from '@blargbot/discord-types';
import { argument } from '@blargbot/test-util/mock.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(RoleSetNameSubtag),
    argCountBounds: { min: 2, max: 3 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.ManageRoles.toString();
        ctx.users.authorizer.member.roles.push(ctx.roles.top.id);
    },
    cases: [
        ...createGetRolePropTestCases({
            generateCode(role, ...args) {
                return `{${['rolesetname', role, 'New name!', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '',
                    postSetup(role, bbctx, ctx) {
                        ctx.roleService.setup(m => m.edit(bbctx, role.id, argument.isDeepEqual({ name: 'New name!' }))).thenResolve(undefined);
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
                ctx.roles.authorizer.permissions = '0';
            }
        },
        {
            code: '{rolesetname;3298746326924;New name!}',
            expected: '`Role above author`',
            errors: [
                { start: 0, end: 37, error: new BBTagRuntimeError('Role above author') }
            ],
            postSetup(bbctx, ctx) {
                ctx.roleService.setup(m => m.querySingle(bbctx, '3298746326924', argument.isDeepEqual({ noLookup: false }))).thenResolve(ctx.roles.top);
            }
        },
        {
            code: '{rolesetname;3298746326924;New name!}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 37, error: new BBTagRuntimeError('Failed to edit role: no perms', 'Test REST error') }
            ],
            postSetup(bbctx, ctx) {
                ctx.roleService.setup(m => m.querySingle(bbctx, '3298746326924', argument.isDeepEqual({ noLookup: false }))).thenResolve(ctx.roles.bot);
                ctx.roleService.setup(m => m.edit(bbctx, ctx.roles.bot.id, argument.isDeepEqual({ name: 'New name!' }))).thenResolve({ error: 'Test REST error' });
            }
        },
        {
            code: '{rolesetname;3298746326924;New name!}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 37, error: new BBTagRuntimeError('Failed to edit role: no perms', 'Some other error message') }
            ],
            postSetup(bbctx, ctx) {
                ctx.roleService.setup(m => m.querySingle(bbctx, '3298746326924', argument.isDeepEqual({ noLookup: false }))).thenResolve(ctx.roles.bot);
                ctx.roleService.setup(m => m.edit(bbctx, ctx.roles.bot.id, argument.isDeepEqual({ name: 'New name!' }))).thenResolve({ error: 'Some other error message' });
            }
        }
    ]
});
