import { BBTagRuntimeError, UserNotFoundError } from '@blargbot/bbtag';
import type { SetUserTimeoutThunk } from '@blargbot/bbtag/subtags';
import { TimeoutSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';
import type * as eris from 'eris';
import moment from 'moment-timezone';

import { runSubtagTests } from '../SubtagTestSuite.js';

const setUserTimeout = new Mock<SetUserTimeoutThunk>({ id: 'setUserTimeout', callable: true });

await runSubtagTests({
    subtag: new TimeoutSubtag({
        setUserTimeout: setUserTimeout.instance
    }),
    argCountBounds: { min: 2, max: 4 },
    names: ['timeout'],
    setup(ctx) {
        ctx.adoptMock(setUserTimeout);
    },
    cases: [
        {
            code: '{timeout;other user;abc}',
            expected: '`Invalid duration`',
            errors: [
                { error: new BBTagRuntimeError('Invalid duration') }
            ]
        },
        {
            code: '{timeout;abc;1s}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('abc') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'abc'))
                    .mustHappen(1)
                    .resolves([]);
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const userId = snowflake.create().toString();
                member.setup(m => m.id).returns(userId);

                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                setUserTimeout.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    reason: 'Tag Timeout',
                    duration: moment.duration({ seconds: 1 })
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{timeout;other user;29d}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const userId = snowflake.create().toString();
                member.setup(m => m.id).returns(userId);

                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                setUserTimeout.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    reason: 'Tag Timeout',
                    duration: moment.duration({ days: 29 })
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{timeout;other user;-1d}',
            expected: '`Invalid duration`',
            errors: [
                { error: new BBTagRuntimeError('Invalid duration') }
            ]
        },
        {
            code: '{timeout;other user;0s}',
            expected: '`User is not timed out`',
            errors: [
                { error: new BBTagRuntimeError('User is not timed out', 'other user is not timed out!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const userId = snowflake.create().toString();
                member.setup(m => m.id).returns(userId);
                const user = ctx.createMock<eris.User>({ id: 'user' });
                user.setup(u => u.username).returns('other user');
                member.setup(m => m.user).returns(user.instance);

                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                setUserTimeout.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    reason: 'Tag Timeout',
                    duration: moment.duration({ seconds: 0 })
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'noChange', reason: 'other user is not timed out!' });
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`User is already timed out`',
            errors: [
                { error: new BBTagRuntimeError('User is already timed out', 'other user is already timed out!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const userId = snowflake.create().toString();
                member.setup(m => m.id).returns(userId);
                const user = ctx.createMock<eris.User>({ id: 'user' });
                user.setup(u => u.username).returns('other user');
                member.setup(m => m.user).returns(user.instance);

                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                setUserTimeout.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    reason: 'Tag Timeout',
                    duration: moment.duration({ seconds: 1 })
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'noChange', reason: 'other user is already timed out!' });
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`Bot has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to (remove) time out (from) users!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const userId = snowflake.create().toString();
                member.setup(m => m.id).returns(userId);

                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                setUserTimeout.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    reason: 'Tag Timeout',
                    duration: moment.duration({ seconds: 1 })
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'bot', reason: 'I don\'t have permission to (remove) time out (from) users!' });
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`Bot has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to (remove) time out (from) other user!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const userId = snowflake.create().toString();
                member.setup(m => m.id).returns(userId);
                const user = ctx.createMock<eris.User>({ id: 'user' });
                user.setup(u => u.username).returns('other user');
                member.setup(m => m.user).returns(user.instance);

                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                setUserTimeout.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    reason: 'Tag Timeout',
                    duration: moment.duration({ seconds: 1 })
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'bot', reason: 'I don\'t have permission to (remove) time out (from) other user!' });
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`User has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to (remove) time out (from) users!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const userId = snowflake.create().toString();
                member.setup(m => m.id).returns(userId);

                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                setUserTimeout.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    reason: 'Tag Timeout',
                    duration: moment.duration({ seconds: 1 })
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'authorizer', reason: 'You don\'t have permission to (remove) time out (from) users!' });
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`User has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to (remove) time out (from) other user!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const userId = snowflake.create().toString();
                member.setup(m => m.id).returns(userId);
                const user = ctx.createMock<eris.User>({ id: 'user' });
                user.setup(u => u.username).returns('other user');
                member.setup(m => m.user).returns(user.instance);

                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                setUserTimeout.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    reason: 'Tag Timeout',
                    duration: moment.duration({ seconds: 1 })
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'authorizer', reason: 'You don\'t have permission to (remove) time out (from) other user!' });
            }
        }
    ]
});
