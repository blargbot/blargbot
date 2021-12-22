import { BBTagRuntimeError, NotANumberError, NotEnoughArgumentsError, TooManyArgumentsError, UserNotFoundError } from '@cluster/bbtag/errors';
import { BanSubtag } from '@cluster/subtags/user/ban';
import { Member, User } from 'eris';
import moment, { Duration } from 'moment-timezone';

import { argument } from '../../../../mock';
import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

function isDuration(ms: number): Duration {
    return argument.is(moment.isDuration).and(x =>
        x.asMilliseconds() === ms)();
}

runSubtagTests({
    subtag: new BanSubtag(),
    cases: [
        {
            code: '{ban}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 5, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        {
            code: '{ban;abc}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 9, error: new UserNotFoundError('abc') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'abc'))
                    .verifiable(1)
                    .thenResolve([]);
            }
        },
        {
            code: '{ban;other user}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(m => m.ban(bbctx.guild, user.instance, bbctx.user, true, 1, 'Tag Ban', isDuration(Infinity)))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{ban;other user}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(m => m.ban(bbctx.guild, user.instance, bbctx.user, true, 1, 'Tag Ban', isDuration(Infinity)))
                    .verifiable(1)
                    .thenResolve('alreadyBanned');
            }
        },
        {
            code: '{ban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('Bot has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(m => m.ban(bbctx.guild, user.instance, bbctx.user, true, 1, 'Tag Ban', isDuration(Infinity)))
                    .verifiable(1)
                    .thenResolve('memberTooHigh');
            }
        },
        {
            code: '{ban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('User has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(m => m.ban(bbctx.guild, user.instance, bbctx.user, true, 1, 'Tag Ban', isDuration(Infinity)))
                    .verifiable(1)
                    .thenResolve('moderatorNoPerms');
            }
        },
        {
            code: '{ban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('User has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(m => m.ban(bbctx.guild, user.instance, bbctx.user, true, 1, 'Tag Ban', isDuration(Infinity)))
                    .verifiable(1)
                    .thenResolve('moderatorTooLow');
            }
        },
        {
            code: '{ban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('Bot has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(m => m.ban(bbctx.guild, user.instance, bbctx.user, true, 1, 'Tag Ban', isDuration(Infinity)))
                    .verifiable(1)
                    .thenResolve('noPerms');
            }
        },
        {
            code: '{ban;other user;5}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(m => m.ban(bbctx.guild, user.instance, bbctx.user, true, 5, 'Tag Ban', isDuration(Infinity)))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{ban;other user;-1}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(m => m.ban(bbctx.guild, user.instance, bbctx.user, true, -1, 'Tag Ban', isDuration(Infinity)))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{ban;other user;abc}',
            expected: 'false',
            errors: [
                { start: 0, end: 20, error: new NotANumberError('abc').withDisplay('false') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

            }
        },
        {
            code: '{ban;other user;;My custom reason}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(m => m.ban(bbctx.guild, user.instance, bbctx.user, true, 1, 'My custom reason', isDuration(Infinity)))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{ban;other user;7;My custom reason}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(m => m.ban(bbctx.guild, user.instance, bbctx.user, true, 7, 'My custom reason', isDuration(Infinity)))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{ban;other user;;;5 days}',
            expected: '432000000',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(m => m.ban(bbctx.guild, user.instance, bbctx.user, true, 1, 'Tag Ban', isDuration(432000000)))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{ban;other user;7;My custom reason;2 hours}',
            expected: '7200000',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(m => m.ban(bbctx.guild, user.instance, bbctx.user, true, 7, 'My custom reason', isDuration(7200000)))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{ban;other user;;;;x}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(m => m.ban(bbctx.guild, user.instance, bbctx.user, false, 1, 'Tag Ban', isDuration(Infinity)))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{ban;other user;;;;false}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(m => m.ban(bbctx.guild, user.instance, bbctx.user, false, 1, 'Tag Ban', isDuration(Infinity)))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{ban;other user;;;;true}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(m => m.ban(bbctx.guild, user.instance, bbctx.user, false, 1, 'Tag Ban', isDuration(Infinity)))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{ban;other user;4;My custom reason;2 hours 30s;abc}',
            expected: '7230000',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(m => m.ban(bbctx.guild, user.instance, bbctx.user, false, 4, 'My custom reason', isDuration(7230000)))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{ban;{eval};{eval};{eval};{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 5, end: 11, error: new MarkerError('eval', 5) },
                { start: 12, end: 18, error: new MarkerError('eval', 12) },
                { start: 19, end: 25, error: new MarkerError('eval', 19) },
                { start: 26, end: 32, error: new MarkerError('eval', 26) },
                { start: 33, end: 39, error: new MarkerError('eval', 33) },
                { start: 40, end: 46, error: new MarkerError('eval', 40) },
                { start: 0, end: 47, error: new TooManyArgumentsError(5, 6) }
            ]
        }
    ]
});
