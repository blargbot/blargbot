import { BBTagRuntimeError, UserNotFoundError } from '@blargbot/bbtag';
import { UnbanSubtag } from '@blargbot/bbtag/subtags';
import type * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new UnbanSubtag(),
    argCountBounds: { min: 1, max: 3 },
    names: ['unban'],
    cases: [
        {
            code: '{unban;abc}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 11, error: new UserNotFoundError('abc') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.getUser('abc'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'abc'))
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
                member.setup(m => m.user).returns(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.unban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, bbctx.local.message.author, 'Tag Unban'))
                    .mustHappen(1)
                    .resolves('success');
            }
        },
        {
            code: '{unban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 18, error: new BBTagRuntimeError('Bot has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.unban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, bbctx.local.message.author, 'Tag Unban'))
                    .mustHappen(1)
                    .resolves('noPerms');
            }
        },
        {
            code: '{unban;other user}',
            expected: 'false',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.unban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, bbctx.local.message.author, 'Tag Unban'))
                    .mustHappen(1)
                    .resolves('notBanned');
            }
        },
        {
            code: '{unban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 18, error: new BBTagRuntimeError('User has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.unban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, bbctx.local.message.author, 'Tag Unban'))
                    .mustHappen(1)
                    .resolves('moderatorNoPerms');
            }
        },
        {
            code: '{unban;other user;My reason here}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.unban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, bbctx.local.message.author, 'My reason here'))
                    .mustHappen(1)
                    .resolves('success');
            }
        },
        {
            code: '{unban;other user;My reason here;x}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                const authorizer = bbctx.local.message.channel.guild.members.get(ctx.users.authorizer.id)?.user;
                if (authorizer === undefined)
                    throw new Error('Authorizer missing');
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.unban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, authorizer, 'My reason here'))
                    .mustHappen(1)
                    .resolves('success');
            }
        },
        {
            code: '{unban;other user;My reason here;}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                ctx.util.setup(m => m.getUser('other user'))
                    .mustHappen(1)
                    .resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.unban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, bbctx.local.message.author, 'My reason here'))
                    .mustHappen(1)
                    .resolves('success');
            }
        }
    ]
});
