import { WarnSubtag } from '@cluster/subtags/user/warn';
import { ModerationType } from '@cluster/utils';
import { Member } from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new WarnSubtag(),
    argCountBounds: { min: 0, max: 3 },
    cases: [
        {
            code: '{warn}',
            expected: '1',
            postSetup(bbctx, ctx) {
                ctx.managers.warns.setup(m => m.warn(bbctx.member, bbctx.user, 1, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve({ state: 'success', type: ModerationType.WARN, warnings: 1 });
            }
        },
        {
            code: '{warn}',
            expected: '7',
            postSetup(bbctx, ctx) {
                ctx.managers.warns.setup(m => m.warn(bbctx.member, bbctx.user, 1, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve({ state: 'alreadyBanned', type: ModerationType.BAN, warnings: 7 });
            }
        },
        {
            code: '{warn;}',
            expected: '2',
            postSetup(bbctx, ctx) {
                ctx.managers.warns.setup(m => m.warn(bbctx.member, bbctx.user, 1, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve({ state: 'countNaN', type: ModerationType.WARN, warnings: 2 });
            }
        },
        {
            code: '{warn;other user}',
            expected: '5',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.warns.setup(m => m.warn(member.instance, bbctx.user, 1, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve({ state: 'countNegative', type: ModerationType.WARN, warnings: 5 });
            }
        },
        {
            code: '{warn;;6}',
            expected: '29',
            postSetup(bbctx, ctx) {
                ctx.managers.warns.setup(m => m.warn(bbctx.member, bbctx.user, 6, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve({ state: 'countZero', type: ModerationType.WARN, warnings: 29 });
            }
        },
        {
            code: '{warn;other user;9}',
            expected: '9',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.warns.setup(m => m.warn(member.instance, bbctx.user, 9, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve({ state: 'memberTooHigh', type: ModerationType.KICK, warnings: 9 });
            }
        },
        {
            code: '{warn;;;My custom reason}',
            expected: '16',
            postSetup(bbctx, ctx) {
                ctx.managers.warns.setup(m => m.warn(bbctx.member, bbctx.user, 1, 'My custom reason'))
                    .verifiable(1)
                    .thenResolve({ state: 'countZero', type: ModerationType.WARN, warnings: 16 });
            }
        },
        {
            code: '{warn;other user;6;My custom reason}',
            expected: '22',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.managers.warns.setup(m => m.warn(member.instance, bbctx.user, 6, 'My custom reason'))
                    .verifiable(1)
                    .thenResolve({ state: 'memberTooHigh', type: ModerationType.KICK, warnings: 22 });
            }
        }
    ]
});
