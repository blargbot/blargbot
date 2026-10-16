import { BBTagRuntimeError, NotANumberError, UserNotFoundError } from '@blargbot/bbtag';
import { BanSubtag } from '@blargbot/bbtag/subtags';
import type { ArgumentMatchers } from '@blargbot/test-util';
import type * as eris from 'eris';
import moment from 'moment-timezone';

import { runSubtagTests } from '../SubtagTestSuite.js';

function isDuration<T>($: ArgumentMatchers<T>, ms: number): moment.Duration {
    return $.satisfies(v => moment.isDuration(v) && v.asMilliseconds() === ms);
}

await runSubtagTests({
    subtag: new BanSubtag(),
    argCountBounds: { min: 1, max: 5 },
    names: ['ban'],
    cases: [
        {
            code: '{ban;abc}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 9, error: new UserNotFoundError('abc') }
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
            code: '{ban;other user}',
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

                ctx.util.setup((m, $) => m.ban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, bbctx.local.message.author, 1, 'Tag Ban', isDuration($, Infinity)))
                    .mustHappen(1)
                    .resolves('success');
            }
        },
        {
            code: '{ban;other user}',
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

                ctx.util.setup((m, $) => m.ban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, bbctx.local.message.author, 1, 'Tag Ban', isDuration($, Infinity)))
                    .mustHappen(1)
                    .resolves('alreadyBanned');
            }
        },
        {
            code: '{ban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('Bot has no permissions') }
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

                ctx.util.setup((m, $) => m.ban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, bbctx.local.message.author, 1, 'Tag Ban', isDuration($, Infinity)))
                    .mustHappen(1)
                    .resolves('memberTooHigh');
            }
        },
        {
            code: '{ban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('User has no permissions') }
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

                ctx.util.setup((m, $) => m.ban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, bbctx.local.message.author, 1, 'Tag Ban', isDuration($, Infinity)))
                    .mustHappen(1)
                    .resolves('moderatorNoPerms');
            }
        },
        {
            code: '{ban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('User has no permissions') }
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

                ctx.util.setup((m, $) => m.ban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, bbctx.local.message.author, 1, 'Tag Ban', isDuration($, Infinity)))
                    .mustHappen(1)
                    .resolves('moderatorTooLow');
            }
        },
        {
            code: '{ban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('Bot has no permissions') }
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

                ctx.util.setup((m, $) => m.ban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, bbctx.local.message.author, 1, 'Tag Ban', isDuration($, Infinity)))
                    .mustHappen(1)
                    .resolves('noPerms');
            }
        },
        {
            code: '{ban;other user;5}',
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

                ctx.util.setup((m, $) => m.ban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, bbctx.local.message.author, 5, 'Tag Ban', isDuration($, Infinity)))
                    .mustHappen(1)
                    .resolves('success');
            }
        },
        {
            code: '{ban;other user;-1}',
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

                ctx.util.setup((m, $) => m.ban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, bbctx.local.message.author, -1, 'Tag Ban', isDuration($, Infinity)))
                    .mustHappen(1)
                    .resolves('success');
            }
        },
        {
            code: '{ban;other user;abc}',
            expected: 'false',
            errors: [
                { start: 0, end: 20, error: new NotANumberError('abc').withDisplay('false') }
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

            }
        },
        {
            code: '{ban;other user;;My custom reason}',
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

                ctx.util.setup((m, $) => m.ban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, bbctx.local.message.author, 1, 'My custom reason', isDuration($, Infinity)))
                    .mustHappen(1)
                    .resolves('success');
            }
        },
        {
            code: '{ban;other user;7;My custom reason}',
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

                ctx.util.setup((m, $) => m.ban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, bbctx.local.message.author, 7, 'My custom reason', isDuration($, Infinity)))
                    .mustHappen(1)
                    .resolves('success');
            }
        },
        {
            code: '{ban;other user;;;5 days}',
            expected: '432000000',
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

                ctx.util.setup((m, $) => m.ban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, bbctx.local.message.author, 1, 'Tag Ban', isDuration($, 432000000)))
                    .mustHappen(1)
                    .resolves('success');
            }
        },
        {
            code: '{ban;other user;7;My custom reason;2 hours}',
            expected: '7200000',
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

                ctx.util.setup((m, $) => m.ban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, bbctx.local.message.author, 7, 'My custom reason', isDuration($, 7200000)))
                    .mustHappen(1)
                    .resolves('success');
            }
        },
        {
            code: '{ban;other user;;;;x}',
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

                ctx.util.setup((m, $) => m.ban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, authorizer, 1, 'Tag Ban', isDuration($, Infinity)))
                    .mustHappen(1)
                    .resolves('success');
            }
        },
        {
            code: '{ban;other user;;;;false}',
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

                ctx.util.setup((m, $) => m.ban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, authorizer, 1, 'Tag Ban', isDuration($, Infinity)))
                    .mustHappen(1)
                    .resolves('success');
            }
        },
        {
            code: '{ban;other user;;;;true}',
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

                ctx.util.setup((m, $) => m.ban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, authorizer, 1, 'Tag Ban', isDuration($, Infinity)))
                    .mustHappen(1)
                    .resolves('success');
            }
        },
        {
            code: '{ban;other user;4;My custom reason;2 hours 30s;abc}',
            expected: '7230000',
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

                ctx.util.setup((m, $) => m.ban(bbctx.local.message.channel.guild, user.instance, bbctx.local.message.author, authorizer, 4, 'My custom reason', isDuration($, 7230000)))
                    .mustHappen(1)
                    .resolves('success');
            }
        }
    ]
});
