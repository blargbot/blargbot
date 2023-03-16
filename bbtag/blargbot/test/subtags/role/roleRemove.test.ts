import { BBTagRuntimeError, RoleNotFoundError, Subtag, UserNotFoundError } from '@bbtag/blargbot';
import { RoleRemoveSubtag } from '@bbtag/blargbot/subtags';
import Discord from '@blargbot/discord-types';
import { argument } from '@blargbot/test-util/mock.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(RoleRemoveSubtag),
    argCountBounds: { min: 1, max: 3 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.ManageRoles.toString();
    },
    cases: [
        {
            code: '{roleremove;3298746326924}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                ctx.roles.other.id = '3298746326924';
                ctx.users.command.member.roles.push(ctx.roles.other.id, ctx.roles.bot.id);
                ctx.dependencies.users.setup(m => m.edit(bbctx.runtime, ctx.users.command.id, argument.isDeepEqual({ roles: [ctx.roles.everyone.id, ctx.roles.command.id, ctx.roles.bot.id] }))).thenResolve();
            }
        },
        {
            code: '{roleremove;3298746326924}',
            expected: 'false',
            setup(ctx) {
                ctx.roles.other.id = '3298746326924';
            }
        },
        {
            code: '{roleremove;["3298746326924","9238476938485"]}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                ctx.roles.other.id = '3298746326924';
                ctx.roles.bot.id = '9238476938485';
                ctx.users.command.member.roles.push(ctx.roles.other.id, ctx.roles.bot.id);
                ctx.dependencies.users.setup(m => m.edit(bbctx.runtime, ctx.users.command.id, argument.isDeepEqual({ roles: [ctx.roles.everyone.id, ctx.roles.command.id] }))).thenResolve();
            }
        },
        {
            code: '{roleremove;["3298746326924",null]}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                ctx.roles.other.id = '3298746326924';
                ctx.roles.bot.id = '9238476938485';
                ctx.users.command.member.roles.push(ctx.roles.other.id, ctx.roles.bot.id);
                ctx.dependencies.users.setup(m => m.edit(bbctx.runtime, ctx.users.command.id, argument.isDeepEqual({ roles: [ctx.roles.everyone.id, ctx.roles.command.id, ctx.roles.bot.id] }))).thenResolve();
            }
        },
        {
            code: '{roleremove;3298746326924}',
            expected: '`Author cannot remove roles`',
            errors: [
                { start: 0, end: 26, error: new BBTagRuntimeError('Author cannot remove roles') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            }
        },
        {
            code: '{roleremove;3298746326924}',
            expected: '`Role above author`',
            errors: [
                { start: 0, end: 26, error: new BBTagRuntimeError('Role above author') }
            ],
            setup(ctx) {
                ctx.roles.top.id = '3298746326924';
            }
        },
        {
            code: '{roleremove;3298746326924}',
            expected: '`No role found`',
            errors: [
                { start: 0, end: 26, error: new RoleNotFoundError('3298746326924') }
            ]
        },
        {
            code: '{roleremove;3298746326924;other user}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                ctx.roles.bot.id = '3298746326924';
                ctx.users.other.member.roles.push(ctx.roles.authorizer.id, ctx.roles.bot.id);
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: false }))).thenResolve(ctx.users.other);
                ctx.dependencies.users.setup(m => m.edit(bbctx.runtime, ctx.users.other.id, argument.isDeepEqual({ roles: [ctx.roles.everyone.id, ctx.roles.other.id, ctx.roles.authorizer.id] }))).thenResolve();
            }
        },
        {
            code: '{roleremove;3298746326924;other user}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 37, error: new UserNotFoundError('other user') }
            ],
            postSetup(bbctx, ctx) {
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: false }))).thenResolve(undefined);
            }
        },
        {
            code: '{roleremove;3298746326924;other user}',
            expected: 'false',
            errors: [
                { start: 0, end: 37, error: new UserNotFoundError('other user').withDisplay('false') }
            ],
            setup(ctx) {
                ctx.rootScope.quiet = true;
            },
            postSetup(bbctx, ctx) {
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).thenResolve(undefined);
            }
        },
        {
            code: '{roleremove;3298746326924;other user;q}',
            expected: 'false',
            errors: [
                { start: 0, end: 39, error: new UserNotFoundError('other user').withDisplay('false') }
            ],
            postSetup(bbctx, ctx) {
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).thenResolve(undefined);
            }
        }
    ]
});
