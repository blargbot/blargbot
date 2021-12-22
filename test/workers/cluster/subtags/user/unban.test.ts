import { BBTagRuntimeError, NotEnoughArgumentsError, TooManyArgumentsError, UserNotFoundError } from '@cluster/bbtag/errors';
import { UnbanSubtag } from '@cluster/subtags/user/unban';
import { Member, User } from 'eris';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new UnbanSubtag(),
    cases: [
        {
            code: '{unban}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 7, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        {
            code: '{unban;abc}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 11, error: new UserNotFoundError('abc') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'abc'))
                    .verifiable(1)
                    .thenResolve([]);
            }
        },
        {
            code: '{unban;other user}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(x => x.unban(bbctx.guild, user.instance, bbctx.user, true, 'Tag Unban'))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{unban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 18, error: new BBTagRuntimeError('Bot has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(x => x.unban(bbctx.guild, user.instance, bbctx.user, true, 'Tag Unban'))
                    .verifiable(1)
                    .thenResolve('noPerms');
            }
        },
        {
            code: '{unban;other user}',
            expected: 'false',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(x => x.unban(bbctx.guild, user.instance, bbctx.user, true, 'Tag Unban'))
                    .verifiable(1)
                    .thenResolve('notBanned');
            }
        },
        {
            code: '{unban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 18, error: new BBTagRuntimeError('User has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(x => x.unban(bbctx.guild, user.instance, bbctx.user, true, 'Tag Unban'))
                    .verifiable(1)
                    .thenResolve('moderatorNoPerms');
            }
        },
        {
            code: '{unban;other user;My reason here}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(x => x.unban(bbctx.guild, user.instance, bbctx.user, true, 'My reason here'))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{unban;other user;My reason here;x}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(x => x.unban(bbctx.guild, user.instance, bbctx.user, false, 'My reason here'))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{unban;other user;My reason here;}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.bans.setup(x => x.unban(bbctx.guild, user.instance, bbctx.user, true, 'My reason here'))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{unban;{eval};{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 7, end: 13, error: new MarkerError('eval', 7) },
                { start: 14, end: 20, error: new MarkerError('eval', 14) },
                { start: 21, end: 27, error: new MarkerError('eval', 21) },
                { start: 28, end: 34, error: new MarkerError('eval', 28) },
                { start: 0, end: 35, error: new TooManyArgumentsError(3, 4) }
            ]
        }
    ]
});
