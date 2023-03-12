import type { Entities } from '@bbtag/blargbot';
import { Subtag } from '@bbtag/blargbot';
import { WarnSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(WarnSubtag),
    argCountBounds: { min: 0, max: 3 },
    cases: [
        {
            code: '{warn}',
            expected: '1',
            postSetup(bbctx, ctx) {
                ctx.dependencies.warnings.setup(m => m.warn(bbctx, bbctx.user, bbctx.user, 1, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve(1);
            }
        },
        {
            code: '{warn}',
            expected: '7',
            postSetup(bbctx, ctx) {
                ctx.dependencies.warnings.setup(m => m.warn(bbctx, bbctx.user, bbctx.user, 1, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve(7);
            }
        },
        {
            code: '{warn;}',
            expected: '2',
            postSetup(bbctx, ctx) {
                ctx.dependencies.warnings.setup(m => m.warn(bbctx, bbctx.user, bbctx.user, 1, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve(2);
            }
        },
        {
            code: '{warn;other user}',
            expected: '5',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<Entities.User>();
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, 'other user'))
                    .thenResolve(member.instance);

                ctx.dependencies.warnings.setup(m => m.warn(bbctx, member.instance, bbctx.user, 1, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve(5);
            }
        },
        {
            code: '{warn;;6}',
            expected: '29',
            postSetup(bbctx, ctx) {
                ctx.dependencies.warnings.setup(m => m.warn(bbctx, bbctx.user, bbctx.user, 6, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve(29);
            }
        },
        {
            code: '{warn;other user;9}',
            expected: '9',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<Entities.User>();
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, 'other user'))
                    .thenResolve(member.instance);

                ctx.dependencies.warnings.setup(m => m.warn(bbctx, member.instance, bbctx.user, 9, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve(9);
            }
        },
        {
            code: '{warn;;;My custom reason}',
            expected: '16',
            postSetup(bbctx, ctx) {
                ctx.dependencies.warnings.setup(m => m.warn(bbctx, bbctx.user, bbctx.user, 1, 'My custom reason'))
                    .verifiable(1)
                    .thenResolve(16);
            }
        },
        {
            code: '{warn;other user;6;My custom reason}',
            expected: '22',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<Entities.User>();
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, 'other user'))
                    .thenResolve(member.instance);

                ctx.dependencies.warnings.setup(m => m.warn(bbctx, member.instance, bbctx.user, 6, 'My custom reason'))
                    .verifiable(1)
                    .thenResolve(22);
            }
        }
    ]
});
