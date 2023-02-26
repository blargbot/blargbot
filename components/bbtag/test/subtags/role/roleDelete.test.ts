import { BBTagRuntimeError, Subtag } from '@bbtag/blargbot';
import { RoleDeleteSubtag } from '@bbtag/blargbot/subtags';
import Discord from '@blargbot/discord-types';
import { argument } from '@blargbot/test-util/mock.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(RoleDeleteSubtag),
    argCountBounds: { min: 1, max: 2 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.ManageRoles.toString();
        ctx.users.authorizer.member.roles.push(ctx.roles.top.id);
    },
    cases: [
        ...createGetRolePropTestCases({
            quiet: '',
            getQueryOptions: q => ({ noLookup: q, noErrors: q }),
            generateCode(...args) {
                return `{${['roledelete', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '',
                    postSetup(role, bbctx, ctx) {
                        ctx.roleService.setup(m => m.delete(bbctx, role.id)).thenResolve(undefined);
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
            postSetup(bbctx, ctx) {
                ctx.roleService.setup(m => m.querySingle(bbctx, '3298746326924', argument.isDeepEqual({ noErrors: false, noLookup: false }))).thenResolve(ctx.roles.top);
            }
        },
        {
            code: '{roledelete;3298746326924}',
            expected: '`Failed to delete role: no perms`',
            errors: [
                { start: 0, end: 26, error: new BBTagRuntimeError('Failed to delete role: no perms', 'Test REST error') }
            ],
            postSetup(bbctx, ctx) {
                ctx.roleService.setup(m => m.querySingle(bbctx, '3298746326924', argument.isDeepEqual({ noErrors: false, noLookup: false }))).thenResolve(ctx.roles.other);
                ctx.roleService.setup(m => m.delete(bbctx, ctx.roles.other.id)).thenResolve({ error: 'Test REST error' });
            }
        },
        {
            code: '{roledelete;3298746326924}',
            expected: '`Failed to delete role: no perms`',
            errors: [
                { start: 0, end: 26, error: new BBTagRuntimeError('Failed to delete role: no perms', 'Some other error message') }
            ],
            postSetup(bbctx, ctx) {
                ctx.roleService.setup(m => m.querySingle(bbctx, '3298746326924', argument.isDeepEqual({ noErrors: false, noLookup: false }))).thenResolve(ctx.roles.other);
                ctx.roleService.setup(m => m.delete(bbctx, ctx.roles.other.id)).thenResolve({ error: 'Some other error message' });
            }
        }
    ]
});
