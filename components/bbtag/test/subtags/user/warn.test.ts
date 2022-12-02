import { WarnSubtag } from '@blargbot/bbtag/subtags/user/warn.js';
import * as Eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new WarnSubtag(),
    argCountBounds: { min: 0, max: 3 },
    cases: [
        {
            code: '{warn}',
            expected: '1',
            postSetup(bbctx, ctx) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ctx.util.setup(m => m.warn(bbctx.member!, bbctx.user, 1, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve(1);
            }
        },
        {
            code: '{warn}',
            expected: '7',
            postSetup(bbctx, ctx) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ctx.util.setup(m => m.warn(bbctx.member!, bbctx.user, 1, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve(7);
            }
        },
        {
            code: '{warn;}',
            expected: '2',
            postSetup(bbctx, ctx) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ctx.util.setup(m => m.warn(bbctx.member!, bbctx.user, 1, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve(2);
            }
        },
        {
            code: '{warn;other user}',
            expected: '5',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Eris.Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(m => m.warn(member.instance, bbctx.user, 1, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve(5);
            }
        },
        {
            code: '{warn;;6}',
            expected: '29',
            postSetup(bbctx, ctx) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ctx.util.setup(m => m.warn(bbctx.member!, bbctx.user, 6, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve(29);
            }
        },
        {
            code: '{warn;other user;9}',
            expected: '9',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Eris.Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(m => m.warn(member.instance, bbctx.user, 9, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve(9);
            }
        },
        {
            code: '{warn;;;My custom reason}',
            expected: '16',
            postSetup(bbctx, ctx) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ctx.util.setup(m => m.warn(bbctx.member!, bbctx.user, 1, 'My custom reason'))
                    .verifiable(1)
                    .thenResolve(16);
            }
        },
        {
            code: '{warn;other user;6;My custom reason}',
            expected: '22',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Eris.Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(m => m.warn(member.instance, bbctx.user, 6, 'My custom reason'))
                    .verifiable(1)
                    .thenResolve(22);
            }
        }
    ]
});
