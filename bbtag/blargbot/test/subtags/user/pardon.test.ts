import type { Entities } from '@bbtag/blargbot';
import { NotANumberError, Subtag, UserNotFoundError } from '@bbtag/blargbot';
import { PardonSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(PardonSubtag),
    argCountBounds: { min: 0, max: 3 },
    cases: [
        {
            code: '{pardon}',
            expected: '0',
            postSetup(bbctx, ctx) {
                ctx.dependencies.warnings.setup(m => m.pardon(bbctx.runtime, bbctx.runtime.user, bbctx.runtime.user, 1, 'Tag Pardon'))
                    .verifiable(1)
                    .thenResolve(0);
            }
        },
        {
            code: '{pardon}',
            expected: '5',
            postSetup(bbctx, ctx) {
                ctx.dependencies.warnings.setup(m => m.pardon(bbctx.runtime, bbctx.runtime.user, bbctx.runtime.user, 1, 'Tag Pardon'))
                    .verifiable(1)
                    .thenResolve(5);
            }
        },
        {
            code: '{pardon;}',
            expected: '3',
            postSetup(bbctx, ctx) {
                ctx.dependencies.warnings.setup(m => m.pardon(bbctx.runtime, bbctx.runtime.user, bbctx.runtime.user, 1, 'Tag Pardon'))
                    .verifiable(1)
                    .thenResolve(3);
            }
        },
        {
            code: '{pardon;other user}',
            expected: '7',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user')).verifiable(1).thenResolve(user.instance);
                ctx.dependencies.warnings.setup(m => m.pardon(bbctx.runtime, user.instance, bbctx.runtime.user, 1, 'Tag Pardon'))
                    .verifiable(1)
                    .thenResolve(7);
            }
        },
        {
            code: '{pardon;;6}',
            expected: '26',
            postSetup(bbctx, ctx) {
                ctx.dependencies.warnings.setup(m => m.pardon(bbctx.runtime, bbctx.runtime.user, bbctx.runtime.user, 6, 'Tag Pardon'))
                    .verifiable(1)
                    .thenResolve(26);
            }
        },
        {
            code: '{pardon;other user;9}',
            expected: '0',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user')).verifiable(1).thenResolve(user.instance);
                ctx.dependencies.warnings.setup(m => m.pardon(bbctx.runtime, user.instance, bbctx.runtime.user, 9, 'Tag Pardon'))
                    .verifiable(1)
                    .thenResolve(0);
            }
        },
        {
            code: '{pardon;other user;8;Because I felt like it}',
            expected: '6',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user')).verifiable(1).thenResolve(user.instance);
                ctx.dependencies.warnings.setup(m => m.pardon(bbctx.runtime, user.instance, bbctx.runtime.user, 8, 'Because I felt like it'))
                    .verifiable(1)
                    .thenResolve(6);
            }
        },
        {
            code: '{pardon;unknown user}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 21, error: new UserNotFoundError('unknown user') }
            ],
            postSetup(bbctx, ctx) {
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'unknown user')).verifiable(1).thenResolve(undefined);
            }
        },
        {
            code: '{pardon;other user;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 23, error: new NotANumberError('abc') }
            ],
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user')).verifiable(1).thenResolve(user.instance);
            }
        }
    ]
});
