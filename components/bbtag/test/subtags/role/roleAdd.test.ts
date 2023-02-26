import { BBTagRuntimeError, RoleNotFoundError, Subtag, UserNotFoundError } from '@bbtag/blargbot';
import { RoleAddSubtag } from '@bbtag/blargbot/subtags';
import { argument } from '@blargbot/test-util/mock.js';
import Discord from '@blargbot/discord-types';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(RoleAddSubtag),
    argCountBounds: { min: 1, max: 3 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.ManageRoles.toString();
    },
    cases: [
        {
            code: '{roleadd;3298746326924}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                ctx.roles.other.id = '3298746326924';
                ctx.userService.setup(m => m.edit(bbctx, ctx.users.command.id, argument.isDeepEqual({ roles: [ctx.roles.everyone.id, ctx.roles.command.id, ctx.roles.other.id] }))).thenResolve();
            }
        },
        {
            code: '{roleadd;3298746326924}',
            expected: 'false',
            setup(ctx) {
                ctx.roles.other.id = '3298746326924';
                ctx.users.command.member.roles.push('3298746326924');
            }
        },
        {
            code: '{roleadd;["3298746326924","9238476938485"]}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                ctx.roles.other.id = '3298746326924';
                ctx.roles.bot.id = '9238476938485';
                ctx.userService.setup(m => m.edit(bbctx, ctx.users.command.id, argument.isDeepEqual({ roles: [ctx.roles.everyone.id, ctx.roles.command.id, ctx.roles.other.id, ctx.roles.bot.id] }))).thenResolve();
            }
        },
        {
            code: '{roleadd;["3298746326924",null]}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                ctx.roles.other.id = '3298746326924';
                ctx.roles.bot.id = '9238476938485';
                ctx.userService.setup(m => m.edit(bbctx, ctx.users.command.id, argument.isDeepEqual({ roles: [ctx.roles.everyone.id, ctx.roles.command.id, ctx.roles.other.id] }))).thenResolve();
            }
        },
        {
            code: '{roleadd;3298746326924}',
            expected: '`Author cannot add roles`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('Author cannot add roles') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            }
        },
        {
            code: '{roleadd;3298746326924}',
            expected: '`Role above author`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('Role above author') }
            ],
            setup(ctx) {
                ctx.roles.top.id = '3298746326924';
            }
        },
        {
            code: '{roleadd;3298746326924}',
            expected: '`No role found`',
            errors: [
                { start: 0, end: 23, error: new RoleNotFoundError('3298746326924') }
            ]
        },
        {
            code: '{roleadd;3298746326924;other user}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                ctx.roles.bot.id = '3298746326924';
                ctx.userService.setup(m => m.edit(bbctx, ctx.users.other.id, argument.isDeepEqual({ roles: [ctx.roles.everyone.id, ctx.roles.other.id, ctx.roles.bot.id] }))).thenResolve();
                ctx.userService.setup(m => m.querySingle(bbctx, 'other user', argument.isDeepEqual({ noLookup: false }))).thenResolve(ctx.users.other);
            }
        },
        {
            code: '{roleadd;3298746326924;other user}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 34, error: new UserNotFoundError('other user') }
            ],
            postSetup(bbctx, ctx) {
                ctx.userService.setup(m => m.querySingle(bbctx, 'other user', argument.isDeepEqual({ noLookup: false }))).thenResolve(undefined);
            }
        },
        {
            code: '{roleadd;3298746326924;other user}',
            expected: 'false',
            errors: [
                { start: 0, end: 34, error: new UserNotFoundError('other user').withDisplay('false') }
            ],
            setup(ctx) {
                ctx.rootScope.quiet = true;
            },
            postSetup(bbctx, ctx) {
                ctx.userService.setup(m => m.querySingle(bbctx, 'other user', argument.isDeepEqual({ noLookup: true }))).thenResolve(undefined);
            }
        },
        {
            code: '{roleadd;3298746326924;other user;q}',
            expected: 'false',
            errors: [
                { start: 0, end: 36, error: new UserNotFoundError('other user').withDisplay('false') }
            ],
            postSetup(bbctx, ctx) {
                ctx.userService.setup(m => m.querySingle(bbctx, 'other user', argument.isDeepEqual({ noLookup: true }))).thenResolve(undefined);
            }
        }
    ]
});
