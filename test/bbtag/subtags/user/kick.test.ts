import { BBTagRuntimeError, UserNotFoundError } from '@blargbot/bbtag';
import type { KickUserThunk } from '@blargbot/bbtag/subtags';
import { KickSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';
import type * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

const kickUser = new Mock<KickUserThunk>({ id: 'kickUser', callable: true });

await runSubtagTests({
    subtag: new KickSubtag({
        kickUser: kickUser.instance
    }),
    argCountBounds: { min: 1, max: 3 },
    names: ['kick'],
    setup(ctx) {
        ctx.adoptMock(kickUser);
    },
    cases: [
        {
            code: '{kick;abc}',
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
            code: '{kick;other user}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const userId = snowflake.create().toString();
                member.setup(m => m.id).returns(userId);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                kickUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    reason: 'Tag Kick'
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{kick;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to kick users!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const userId = snowflake.create().toString();
                member.setup(m => m.id).returns(userId);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                kickUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    reason: 'Tag Kick'
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'bot', reason: 'I don\'t have permission to kick users!' });
            }
        },
        {
            code: '{kick;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to kick other user!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const userId = snowflake.create().toString();
                member.setup(m => m.id).returns(userId);
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.username).returns('other user');
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                kickUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    reason: 'Tag Kick'
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'bot', reason: 'I don\'t have permission to kick other user!' });
            }
        },
        {
            code: '{kick;other user}',
            expected: '`User has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to kick users!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const userId = snowflake.create().toString();
                member.setup(m => m.id).returns(userId);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                kickUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    reason: 'Tag Kick'
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'authorizer', reason: 'You don\'t have permission to kick users!' });
            }
        },
        {
            code: '{kick;other user}',
            expected: '`User has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to kick other user!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const userId = snowflake.create().toString();
                member.setup(m => m.id).returns(userId);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                kickUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    reason: 'Tag Kick'
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'authorizer', reason: 'You don\'t have permission to kick other user!' });
            }
        },
        {
            code: '{kick;other user;My reason here}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const userId = snowflake.create().toString();
                member.setup(m => m.id).returns(userId);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                kickUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    reason: 'My reason here'
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{kick;other user;My reason here;x}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const userId = snowflake.create().toString();
                member.setup(m => m.id).returns(userId);
                const authorizer = bbctx.root.message.channel.guild.members.get(ctx.users.authorizer.id)?.user;
                if (authorizer === undefined)
                    throw new Error('Authorizer missing');
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                kickUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: authorizer.id,
                    reason: 'My reason here'
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{kick;other user;My reason here;}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const userId = snowflake.create().toString();
                member.setup(m => m.id).returns(userId);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                kickUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    reason: 'My reason here'
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        }
    ]
});
