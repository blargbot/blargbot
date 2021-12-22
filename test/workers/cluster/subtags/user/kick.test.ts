import { BBTagRuntimeError, NotEnoughArgumentsError, TooManyArgumentsError, UserNotFoundError } from '@cluster/bbtag/errors';
import { KickSubtag } from '@cluster/subtags/user/kick';
import { Member, User } from 'eris';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new KickSubtag(),
    cases: [
        {
            code: '{kick}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 6, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        {
            code: '{kick;abc}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 10, error: new UserNotFoundError('abc') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'abc'))
                    .verifiable(1)
                    .thenResolve([]);
            }
        },
        {
            code: '{kick;other user}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(x => x.kick(member.instance, bbctx.user, true, 'Tag Kick'))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{kick;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to kick users!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(x => x.kick(member.instance, bbctx.user, true, 'Tag Kick'))
                    .verifiable(1)
                    .thenResolve('noPerms');
            }
        },
        {
            code: '{kick;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to kick other user!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.username).thenReturn('other user');
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(x => x.kick(member.instance, bbctx.user, true, 'Tag Kick'))
                    .verifiable(1)
                    .thenResolve('memberTooHigh');
            }
        },
        {
            code: '{kick;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to kick users!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(x => x.kick(member.instance, bbctx.user, true, 'Tag Kick'))
                    .verifiable(1)
                    .thenResolve('moderatorNoPerms');
            }
        },
        {
            code: '{kick;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to kick other user!') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.username).thenReturn('other user');
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(x => x.kick(member.instance, bbctx.user, true, 'Tag Kick'))
                    .verifiable(1)
                    .thenResolve('moderatorTooLow');
            }
        },
        {
            code: '{kick;other user;My reason here}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(x => x.kick(member.instance, bbctx.user, true, 'My reason here'))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{kick;other user;My reason here;x}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(x => x.kick(member.instance, bbctx.user, false, 'My reason here'))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{kick;other user;My reason here;}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(x => x.kick(member.instance, bbctx.user, true, 'My reason here'))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{kick;{eval};{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 6, end: 12, error: new MarkerError('eval', 6) },
                { start: 13, end: 19, error: new MarkerError('eval', 13) },
                { start: 20, end: 26, error: new MarkerError('eval', 20) },
                { start: 27, end: 33, error: new MarkerError('eval', 27) },
                { start: 0, end: 34, error: new TooManyArgumentsError(3, 4) }
            ]
        }
    ]
});
