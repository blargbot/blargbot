import type { Entities } from '@bbtag/blargbot';
import { BBTagRuntimeError, Subtag, UserNotFoundError } from '@bbtag/blargbot';
import { UnbanSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(UnbanSubtag),
    argCountBounds: { min: 1, max: 3 },
    cases: [
        {
            code: '{unban;abc}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 11, error: new UserNotFoundError('abc') }
            ],
            postSetup(bbctx, ctx) {
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'abc'))
                    .verifiable(1)
                    .thenResolve(undefined);
            }
        },
        {
            code: '{unban;other user}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user'))
                    .verifiable(1)
                    .thenResolve(user.instance);
                ctx.dependencies.users.setup(x => x.unban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, bbctx.runtime.user, 'Tag Unban'))
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
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user'))
                    .verifiable(1)
                    .thenResolve(user.instance);
                ctx.dependencies.users.setup(x => x.unban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, bbctx.runtime.user, 'Tag Unban'))
                    .verifiable(1)
                    .thenResolve('noPerms');
            }
        },
        {
            code: '{unban;other user}',
            expected: 'false',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user'))
                    .verifiable(1)
                    .thenResolve(user.instance);
                ctx.dependencies.users.setup(x => x.unban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, bbctx.runtime.user, 'Tag Unban'))
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
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user'))
                    .verifiable(1)
                    .thenResolve(user.instance);
                ctx.dependencies.users.setup(x => x.unban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, bbctx.runtime.user, 'Tag Unban'))
                    .verifiable(1)
                    .thenResolve('moderatorNoPerms');
            }
        },
        {
            code: '{unban;other user;My reason here}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user'))
                    .verifiable(1)
                    .thenResolve(user.instance);
                ctx.dependencies.users.setup(x => x.unban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, bbctx.runtime.user, 'My reason here'))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{unban;other user;My reason here;x}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user'))
                    .verifiable(1)
                    .thenResolve(user.instance);
                ctx.dependencies.users.setup(x => x.unban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, ctx.users.authorizer, 'My reason here'))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{unban;other user;My reason here;}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user'))
                    .verifiable(1)
                    .thenResolve(user.instance);
                ctx.dependencies.users.setup(x => x.unban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, bbctx.runtime.user, 'My reason here'))
                    .verifiable(1)
                    .thenResolve('success');
            }
        }
    ]
});
