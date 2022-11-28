import { BBTagRuntimeError, RoleNotFoundError, UserNotFoundError } from '@blargbot/bbtag/errors';
import { RoleRemoveSubtag } from '@blargbot/bbtag/subtags/role/roleRemove';
import { argument } from '@blargbot/test-util/mock';
import Eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new RoleRemoveSubtag(),
    argCountBounds: { min: 1, max: 3 },
    setup(ctx) {
        ctx.roles.authorizer.permissions = Eris.Constants.Permissions.manageRoles.toString();
    },
    cases: [
        {
            code: '{roleremove;3298746326924}',
            expected: 'true',
            setup(ctx) {
                ctx.roles.other.id = '3298746326924';
                ctx.members.command.roles.push(ctx.roles.other.id, ctx.roles.bot.id);
                ctx.discord.setup(m => m.editGuildMember(ctx.guild.id, ctx.users.command.id, argument.isDeepEqual({ roles: [ctx.roles.command.id, ctx.roles.bot.id] }), 'Command User#0000'))
                    .thenResolve();
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
            setup(ctx) {
                ctx.roles.other.id = '3298746326924';
                ctx.roles.bot.id = '9238476938485';
                ctx.members.command.roles.push(ctx.roles.other.id, ctx.roles.bot.id);
                ctx.discord.setup(m => m.editGuildMember(ctx.guild.id, ctx.users.command.id, argument.isDeepEqual({ roles: [ctx.roles.command.id] }), 'Command User#0000'))
                    .thenResolve();
            }
        },
        {
            code: '{roleremove;["3298746326924",null]}',
            expected: 'true',
            setup(ctx) {
                ctx.roles.other.id = '3298746326924';
                ctx.roles.bot.id = '9238476938485';
                ctx.members.command.roles.push(ctx.roles.other.id, ctx.roles.bot.id);
                ctx.discord.setup(m => m.editGuildMember(ctx.guild.id, ctx.users.command.id, argument.isDeepEqual({ roles: [ctx.roles.command.id, ctx.roles.bot.id] }), 'Command User#0000'))
                    .thenResolve();
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
            setup(ctx) {
                ctx.roles.bot.id = '3298746326924';
                ctx.members.other.roles.push(ctx.roles.authorizer.id, ctx.roles.bot.id);
                ctx.discord.setup(m => m.editGuildMember(ctx.guild.id, ctx.users.other.id, argument.isDeepEqual({ roles: [ctx.roles.other.id, ctx.roles.authorizer.id] }), 'Command User#0000'))
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
            code: '{roleremove;3298746326924;other user}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 37, error: new UserNotFoundError('other user') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .thenResolve([]);
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
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .thenResolve([]);
            }
        },
        {
            code: '{roleremove;3298746326924;other user;q}',
            expected: 'false',
            errors: [
                { start: 0, end: 39, error: new UserNotFoundError('other user').withDisplay('false') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .thenResolve([]);
            }
        }
    ]
});
