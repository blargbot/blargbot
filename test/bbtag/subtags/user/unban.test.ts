import { BBTagRuntimeError, UserNotFoundError } from '@blargbot/bbtag';
import type { UnbanUserThunk } from '@blargbot/bbtag/subtags';
import { UnbanSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';
import type * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

const unbanUser = new Mock<UnbanUserThunk>({ id: 'unbanUser', callable: true });

await runSubtagTests({
    subtag: new UnbanSubtag({
        unbanUser: unbanUser.instance
    }),
    argCountBounds: { min: 1, max: 3 },
    names: ['unban'],
    setup(ctx) {
        ctx.adoptMock(unbanUser);
    },
    cases: [
        {
            code: '{unban;abc}',
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
            code: '{unban;other user}',
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

                unbanUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    reason: 'Tag Unban'
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{unban;other user}',
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

                unbanUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    reason: 'Tag Unban'
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'bot' });
            }
        },
        {
            code: '{unban;other user}',
            expected: 'false',
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

                unbanUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    reason: 'Tag Unban'
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'notBanned' });
            }
        },
        {
            code: '{unban;other user}',
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

                unbanUser.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    reason: 'Tag Unban'
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'authorizer' });
            }
        },
        {
            code: '{unban;other user;My reason here}',
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

                unbanUser.setup((m, $) => m($({
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
            code: '{unban;other user;My reason here;x}',
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

                unbanUser.setup((m, $) => m($({
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
            code: '{unban;other user;My reason here;}',
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

                unbanUser.setup((m, $) => m($({
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
