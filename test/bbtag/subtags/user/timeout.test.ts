import { BBTagRuntimeError, UserNotFoundError } from '@blargbot/bbtag';
import { TimeoutSubtag } from '@blargbot/bbtag/subtags';
import type { ArgumentMatchers } from '@blargbot/test-util';
import type * as eris from 'eris';
import moment from 'moment-timezone';

import { runSubtagTests } from '../SubtagTestSuite.js';

function isDuration<T>($: ArgumentMatchers<T>, ms: number): moment.Duration {
    return $.satisfies(v => moment.isDuration(v) && v.asMilliseconds() === ms);
}

await runSubtagTests({
    subtag: new TimeoutSubtag(),
    argCountBounds: { min: 2, max: 4 },
    names: ['timeout'],
    cases: [
        {
            code: '{timeout;other user;abc}',
            expected: '`Invalid duration`',
            errors: [
                { start: 0, end: 24, error: new BBTagRuntimeError('Invalid duration') }
            ]
        },
        {
            code: '{timeout;abc;1s}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 16, error: new UserNotFoundError('abc') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'abc'))
                    .mustHappen(1)
                    .resolves([]);
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });

                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup((m, $) => m.timeout(member.instance, bbctx.local.message.author, bbctx.local.message.author, isDuration($, 1000), 'Tag Timeout'))
                    .mustHappen(1)
                    .resolves('success');
            }
        },
        {
            code: '{timeout;other user;29d}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });

                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup((m, $) => m.timeout(member.instance, bbctx.local.message.author, bbctx.local.message.author, isDuration($, 2505600000), 'Tag Timeout'))
                    .mustHappen(1)
                    .resolves('success');
            }
        },
        {
            code: '{timeout;other user;-1d}',
            expected: '`Invalid duration`',
            errors: [
                { start: 0, end: 24, error: new BBTagRuntimeError('Invalid duration') }
            ]
        },
        {
            code: '{timeout;other user;0s}',
            expected: '`User is not timed out`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User is not timed out', 'other user is not timed out!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                user.setup(u => u.username).returns('other user');
                member.setup(m => m.user).returns(user.instance);

                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.clearTimeout(member.instance, bbctx.local.message.author, bbctx.local.message.author, 'Tag Timeout'))
                    .mustHappen(1)
                    .resolves('notTimedOut');
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`User is already timed out`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User is already timed out', 'other user is already timed out!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                user.setup(u => u.username).returns('other user');
                member.setup(m => m.user).returns(user.instance);

                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup((m, $) => m.timeout(member.instance, bbctx.local.message.author, bbctx.local.message.author, isDuration($, 1000), 'Tag Timeout'))
                    .mustHappen(1)
                    .resolves('alreadyTimedOut');
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to (remove) time out (from) users!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });

                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup((m, $) => m.timeout(member.instance, bbctx.local.message.author, bbctx.local.message.author, isDuration($, 1000), 'Tag Timeout'))
                    .mustHappen(1)
                    .resolves('noPerms');
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to (remove) time out (from) other user!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                user.setup(u => u.username).returns('other user');
                member.setup(m => m.user).returns(user.instance);

                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup((m, $) => m.timeout(member.instance, bbctx.local.message.author, bbctx.local.message.author, isDuration($, 1000), 'Tag Timeout'))
                    .mustHappen(1)
                    .resolves('memberTooHigh');
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to (remove) time out (from) users!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });

                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup((m, $) => m.timeout(member.instance, bbctx.local.message.author, bbctx.local.message.author, isDuration($, 1000), 'Tag Timeout'))
                    .mustHappen(1)
                    .resolves('moderatorNoPerms');
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to (remove) time out (from) other user!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                user.setup(u => u.username).returns('other user');
                member.setup(m => m.user).returns(user.instance);

                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup((m, $) => m.timeout(member.instance, bbctx.local.message.author, bbctx.local.message.author, isDuration($, 1000), 'Tag Timeout'))
                    .mustHappen(1)
                    .resolves('moderatorTooLow');
            }
        }
    ]
});
