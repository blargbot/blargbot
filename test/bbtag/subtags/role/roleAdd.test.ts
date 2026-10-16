import { BBTagRuntimeError, RoleNotFoundError, UserNotFoundError } from '@blargbot/bbtag';
import { RoleAddSubtag } from '@blargbot/bbtag/subtags';
import type { Logger } from '@blargbot/logger';
import { Mock } from '@blargbot/test-util';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

const logger = new Mock<Logger>({ id: 'logger' });

await runSubtagTests({
    subtag: new RoleAddSubtag({
        logger: logger.instance
    }),
    argCountBounds: { min: 1, max: 3 },
    names: ['roleAdd', 'addRole'],
    setup(ctx) {
        ctx.adoptMock(logger);
        ctx.roles.authorizer.permissions = eris.Constants.Permissions.manageRoles.toString();
    },
    cases: [
        {
            code: '{roleadd;3298746326924}',
            expected: 'true',
            setup(ctx) {
                ctx.roles.other.id = '3298746326924';
                ctx.discord.setup((m, $) => m.editGuildMember(ctx.guild.id, ctx.users.command.id, $({ roles: [ctx.roles.command.id, ctx.roles.other.id] }), 'Command User#0000'))
                    .resolves(null!);
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
                ctx.discord.setup((m, $) => m.editGuildMember(ctx.guild.id, ctx.users.command.id, $({ roles: [ctx.roles.command.id, ctx.roles.other.id, ctx.roles.bot.id] }), 'Command User#0000'))
                    .resolves(null!);
            }
        },
        {
            code: '{roleadd;["3298746326924",null]}',
            expected: 'true',
            setup(ctx) {
                ctx.roles.other.id = '3298746326924';
                ctx.roles.bot.id = '9238476938485';
                ctx.discord.setup((m, $) => m.editGuildMember(ctx.guild.id, ctx.users.command.id, $({ roles: [ctx.roles.command.id, ctx.roles.other.id] }), 'Command User#0000'))
                    .resolves(null!);
            }
        },
        {
            code: '{roleadd;3298746326924}',
            expected: '`Author cannot add roles`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot add roles') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            }
        },
        {
            code: '{roleadd;3298746326924}',
            expected: '`Role above author`',
            errors: [
                { error: new BBTagRuntimeError('Role above author') }
            ],
            setup(ctx) {
                ctx.roles.top.id = '3298746326924';
            }
        },
        {
            code: '{roleadd;3298746326924}',
            expected: '`No role found`',
            errors: [
                { error: new RoleNotFoundError('3298746326924') }
            ]
        },
        {
            code: '{roleadd;3298746326924;other user}',
            expected: 'true',
            setup(ctx) {
                ctx.roles.bot.id = '3298746326924';
                ctx.discord.setup((m, $) => m.editGuildMember(ctx.guild.id, ctx.users.other.id, $({ roles: [ctx.roles.other.id, ctx.roles.bot.id] }), 'Command User#0000'))
                    .resolves(null!);
            },
            postSetup(bbctx, ctx) {
                const member = bbctx.root.message.channel.guild.members.get(ctx.users.other.id);
                if (member === undefined)
                    throw new Error('Unable to find member under test');
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .resolves([member]);
            }
        },
        {
            code: '{roleadd;3298746326924;other user}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('other user') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .resolves([]);
            }
        },
        {
            code: '{roleadd;3298746326924;other user}',
            expected: 'false',
            errors: [
                { error: new UserNotFoundError('other user').withDisplay('false') }
            ],
            postSetup(bbctx, ctx) {
                bbctx.root.quiet = true;
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .resolves([]);
            }
        },
        {
            code: '{roleadd;3298746326924;other user;q}',
            expected: 'false',
            errors: [
                { error: new UserNotFoundError('other user').withDisplay('false') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .resolves([]);
            }
        }
    ]
});
