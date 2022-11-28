import { BBTagRuntimeError, UserNotFoundError } from '@blargbot/bbtag/errors';
import { TimeoutSubtag } from '@blargbot/bbtag/subtags/user/timeout';
import { argument } from '@blargbot/test-util/mock';
import { Member, User } from 'eris';
import moment, { Duration } from 'moment-timezone';

import { runSubtagTests } from '../SubtagTestSuite';

function isDuration(ms: number): Duration {
    return argument.is(moment.isDuration).and(x =>
        x.asMilliseconds() === ms).value;
}

runSubtagTests({
    subtag: new TimeoutSubtag(),
    argCountBounds: { min: 2, max: 4 },
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
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'abc'))
                    .verifiable(1)
                    .thenResolve([]);
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);

                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.timeout(member.instance, bbctx.user, bbctx.user, isDuration(1000), 'Tag Timeout'))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{timeout;other user;29d}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);

                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.timeout(member.instance, bbctx.user, bbctx.user, isDuration(2505600000), 'Tag Timeout'))
                    .verifiable(1)
                    .thenResolve('success');
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
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                user.setup(u => u.username).thenReturn('other user');
                member.setup(m => m.user).thenReturn(user.instance);

                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.clearTimeout(member.instance, bbctx.user, bbctx.user, 'Tag Timeout'))
                    .verifiable(1)
                    .thenResolve('notTimedOut');
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`User is already timed out`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User is already timed out', 'other user is already timed out!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                user.setup(u => u.username).thenReturn('other user');
                member.setup(m => m.user).thenReturn(user.instance);

                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.timeout(member.instance, bbctx.user, bbctx.user, isDuration(1000), 'Tag Timeout'))
                    .verifiable(1)
                    .thenResolve('alreadyTimedOut');
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to (remove) time out (from) users!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);

                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.timeout(member.instance, bbctx.user, bbctx.user, isDuration(1000), 'Tag Timeout'))
                    .verifiable(1)
                    .thenResolve('noPerms');
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to (remove) time out (from) other user!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                user.setup(u => u.username).thenReturn('other user');
                member.setup(m => m.user).thenReturn(user.instance);

                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.timeout(member.instance, bbctx.user, bbctx.user, isDuration(1000), 'Tag Timeout'))
                    .verifiable(1)
                    .thenResolve('memberTooHigh');
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to (remove) time out (from) users!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);

                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.timeout(member.instance, bbctx.user, bbctx.user, isDuration(1000), 'Tag Timeout'))
                    .verifiable(1)
                    .thenResolve('moderatorNoPerms');
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to (remove) time out (from) other user!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                user.setup(u => u.username).thenReturn('other user');
                member.setup(m => m.user).thenReturn(user.instance);

                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.timeout(member.instance, bbctx.user, bbctx.user, isDuration(1000), 'Tag Timeout'))
                    .verifiable(1)
                    .thenResolve('moderatorTooLow');
            }
        }
    ]
});
