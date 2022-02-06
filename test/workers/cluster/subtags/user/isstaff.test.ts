import { TooManyArgumentsError, UserNotFoundError } from '@cluster/bbtag/errors';
import { IsStaffSubtag } from '@cluster/subtags/user/isstaff';
import { Member } from 'eris';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new IsStaffSubtag(),
    cases: [
        {
            code: '{isstaff}',
            expected: 'true',
            setup(ctx) {
                ctx.isStaff = true;
            }
        },
        {
            code: '{isstaff}',
            expected: 'false',
            setup(ctx) {
                ctx.isStaff = false;
            }
        },
        {
            code: '{isstaff;other user}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);
                ctx.util.setup(m => m.isUserStaff(member.instance))
                    .verifiable(1)
                    .thenResolve(true);
            }
        },
        {
            code: '{isstaff;other user}',
            expected: 'false',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);
                ctx.util.setup(m => m.isUserStaff(member.instance))
                    .verifiable(1)
                    .thenResolve(false);
            }
        },
        {
            code: '{isstaff;other user}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 20, error: new UserNotFoundError('other user') }

            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([]);
            }
        },
        {
            code: '{isstaff;other user;}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 21, error: new UserNotFoundError('other user') }

            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([]);
            }
        },
        {
            code: '{isstaff;other user;q}',
            expected: '',
            errors: [
                { start: 0, end: 22, error: new UserNotFoundError('other user').withDisplay('') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([]);
            }
        },
        {
            code: '{isstaff;{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 16, end: 22, error: new MarkerError('eval', 16) },
                { start: 23, end: 29, error: new MarkerError('eval', 23) },
                { start: 0, end: 30, error: new TooManyArgumentsError(2, 3) }]
        }
    ]
});
