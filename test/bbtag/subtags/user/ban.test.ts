import { BBTagRuntimeError, NotANumberError, UserNotFoundError } from '@blargbot/bbtag';
import type { BanUserThunk } from '@blargbot/bbtag/subtags';
import { BanSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';
import type * as eris from 'eris';
import moment from 'moment-timezone';

import { runSubtagTests } from '../SubtagTestSuite.js';

const banUser = new Mock<BanUserThunk>({ id: 'banUser', callable: true });

await runSubtagTests({
    subtag: new BanSubtag({
        banUser: banUser.instance
    }),
    argCountBounds: { min: 1, max: 5 },
    names: ['ban'],
    setup(ctx) {
        ctx.adoptMock(banUser);
    },
    cases: [
        {
            code: '{ban;abc}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('abc') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.getUser('abc'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'abc'))
                    .mustHappen(1)
                    .resolves([]);
            }
        },
        {
            code: '{ban;other user}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const userId = snowflake.create().toString();
                user.setup(m => m.id).returns(userId);
                member.setup(m => m.user).returns(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                banUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const userId = snowflake.create().toString();
                user.setup(m => m.id).returns(userId);
                member.setup(m => m.user).returns(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                banUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('Bot has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const userId = snowflake.create().toString();
                user.setup(m => m.id).returns(userId);
                member.setup(m => m.user).returns(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                banUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: false, reason: 'bot' });
            }
        },
        {
            code: '{ban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('User has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const userId = snowflake.create().toString();
                user.setup(m => m.id).returns(userId);
                member.setup(m => m.user).returns(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                banUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: false, reason: 'authorizer' });
            }
        },
        {
            code: '{ban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('User has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const userId = snowflake.create().toString();
                user.setup(m => m.id).returns(userId);
                member.setup(m => m.user).returns(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                banUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: false, reason: 'authorizer' });
            }
        },
        {
            code: '{ban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('Bot has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const userId = snowflake.create().toString();
                user.setup(m => m.id).returns(userId);
                member.setup(m => m.user).returns(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                banUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: false, reason: 'bot' });
            }
        },
        {
            code: '{ban;other user;5}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const userId = snowflake.create().toString();
                user.setup(m => m.id).returns(userId);
                member.setup(m => m.user).returns(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                banUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 5,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;-1}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const userId = snowflake.create().toString();
                user.setup(m => m.id).returns(userId);
                member.setup(m => m.user).returns(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                banUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: -1,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;abc}',
            expected: 'false',
            errors: [
                { error: new NotANumberError('abc').withDisplay('false') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

            }
        },
        {
            code: '{ban;other user;;My custom reason}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const userId = snowflake.create().toString();
                user.setup(m => m.id).returns(userId);
                member.setup(m => m.user).returns(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                banUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 1,
                    reason: 'My custom reason',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;7;My custom reason}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const userId = snowflake.create().toString();
                user.setup(m => m.id).returns(userId);
                member.setup(m => m.user).returns(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                banUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 7,
                    reason: 'My custom reason',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;;;5 days}',
            expected: '432000000',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const userId = snowflake.create().toString();
                user.setup(m => m.id).returns(userId);
                member.setup(m => m.user).returns(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                banUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    unbanAfter: moment.duration({ days: 5 })
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;7;My custom reason;2 hours}',
            expected: '7200000',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const userId = snowflake.create().toString();
                user.setup(m => m.id).returns(userId);
                member.setup(m => m.user).returns(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                banUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 7,
                    reason: 'My custom reason',
                    unbanAfter: moment.duration({ hours: 2 })
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;;;;x}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const userId = snowflake.create().toString();
                user.setup(m => m.id).returns(userId);
                member.setup(m => m.user).returns(user.instance);
                const authorizer = bbctx.root.message.channel.guild.members.get(ctx.users.authorizer.id)?.user;
                if (authorizer === undefined)
                    throw new Error('Authorizer missing');
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                banUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: authorizer.id,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;;;;false}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const userId = snowflake.create().toString();
                user.setup(m => m.id).returns(userId);
                member.setup(m => m.user).returns(user.instance);
                const authorizer = bbctx.root.message.channel.guild.members.get(ctx.users.authorizer.id)?.user;
                if (authorizer === undefined)
                    throw new Error('Authorizer missing');
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                banUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: authorizer.id,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;;;;true}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const userId = snowflake.create().toString();
                user.setup(m => m.id).returns(userId);
                member.setup(m => m.user).returns(user.instance);
                const authorizer = bbctx.root.message.channel.guild.members.get(ctx.users.authorizer.id)?.user;
                if (authorizer === undefined)
                    throw new Error('Authorizer missing');
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                banUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: authorizer.id,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;4;My custom reason;2 hours 30s;abc}',
            expected: '7230000',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const userId = snowflake.create().toString();
                user.setup(m => m.id).returns(userId);
                member.setup(m => m.user).returns(user.instance);
                const authorizer = bbctx.root.message.channel.guild.members.get(ctx.users.authorizer.id)?.user;
                if (authorizer === undefined)
                    throw new Error('Authorizer missing');
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                banUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: authorizer.id,
                    daysToDelete: 4,
                    reason: 'My custom reason',
                    unbanAfter: moment.duration({ hours: 2, seconds: 30 })
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        }
    ]
});
