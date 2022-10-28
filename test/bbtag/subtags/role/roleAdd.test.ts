import { BBTagRuntimeError, RoleNotFoundError, UserNotFoundError } from '@blargbot/bbtag/errors';
import { RoleAddSubtag } from '@blargbot/bbtag/subtags/role/roleAdd';
import { argument } from '@blargbot/test-util/mock';
import { Constants } from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new RoleAddSubtag(),
    argCountBounds: { min: 1, max: 3 },
    setup(ctx) {
        ctx.roles.authorizer.permissions = Constants.Permissions.manageRoles.toString();
    },
    cases: [
        {
            code: '{roleadd;3298746326924}',
            expected: 'true',
            setup(ctx) {
                ctx.roles.other.id = '3298746326924';
                ctx.discord.setup(m => m.editGuildMember(ctx.guild.id, ctx.users.command.id, argument.isDeepEqual({ roles: [ctx.roles.command.id, ctx.roles.other.id] }), 'Command User#0000'))
                    .thenResolve();
            }
        },
        {
            code: '{roleadd;3298746326924}',
            expected: 'false',
            setup(ctx) {
                ctx.roles.other.id = '3298746326924';
                ctx.members.command.roles.push('3298746326924');
            }
        },
        {
            code: '{roleadd;["3298746326924","9238476938485"]}',
            expected: 'true',
            setup(ctx) {
                ctx.roles.other.id = '3298746326924';
                ctx.roles.bot.id = '9238476938485';
                ctx.discord.setup(m => m.editGuildMember(ctx.guild.id, ctx.users.command.id, argument.isDeepEqual({ roles: [ctx.roles.command.id, ctx.roles.other.id, ctx.roles.bot.id] }), 'Command User#0000'))
                    .thenResolve();
            }
        },
        {
            code: '{roleadd;["3298746326924",null]}',
            expected: 'true',
            setup(ctx) {
                ctx.roles.other.id = '3298746326924';
                ctx.roles.bot.id = '9238476938485';
                ctx.discord.setup(m => m.editGuildMember(ctx.guild.id, ctx.users.command.id, argument.isDeepEqual({ roles: [ctx.roles.command.id, ctx.roles.other.id] }), 'Command User#0000'))
                    .thenResolve();
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
            setup(ctx) {
                ctx.roles.bot.id = '3298746326924';
                ctx.discord.setup(m => m.editGuildMember(ctx.guild.id, ctx.users.other.id, argument.isDeepEqual({ roles: [ctx.roles.other.id, ctx.roles.bot.id] }), 'Command User#0000'))
                    .thenResolve();
            },
            postSetup(bbctx, ctx) {
                const member = bbctx.guild.members.get(ctx.users.other.id);
                if (member === undefined)
                    throw new Error('Unable to find member under test');
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .thenResolve([member]);
            }
        },
        {
            code: '{roleadd;3298746326924;other user}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 34, error: new UserNotFoundError('other user') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .thenResolve([]);
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
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .thenResolve([]);
            }
        },
        {
            code: '{roleadd;3298746326924;other user;q}',
            expected: 'false',
            errors: [
                { start: 0, end: 36, error: new UserNotFoundError('other user').withDisplay('false') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .thenResolve([]);
            }
        }
    ]
});
