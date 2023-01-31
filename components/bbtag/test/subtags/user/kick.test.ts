import type { Entities } from '@blargbot/bbtag';
import { BBTagRuntimeError, Subtag, UserNotFoundError } from '@blargbot/bbtag';
import { KickSubtag } from '@blargbot/bbtag/subtags';
import { argument } from '@blargbot/test-util/mock.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(KickSubtag),
    argCountBounds: { min: 1, max: 3 },
    cases: [
        {
            code: '{kick;abc}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 10, error: new UserNotFoundError('abc') }
            ],
            postSetup(bbctx, ctx) {
                ctx.userService.setup(m => m.querySingle(bbctx, 'abc', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(undefined);
            }
        },
        {
            code: '{kick;other user}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.userService.setup(m => m.querySingle(bbctx, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.util.setup(m => m.kick(user.instance, bbctx.user, bbctx.user, 'Tag Kick'))
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
                const user = ctx.createMock<Entities.User>();
                ctx.userService.setup(m => m.querySingle(bbctx, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.util.setup(m => m.kick(user.instance, bbctx.user, bbctx.user, 'Tag Kick'))
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
                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.username).thenReturn('other user');
                ctx.userService.setup(m => m.querySingle(bbctx, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.util.setup(m => m.kick(user.instance, bbctx.user, bbctx.user, 'Tag Kick'))
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
                const user = ctx.createMock<Entities.User>();
                ctx.userService.setup(m => m.querySingle(bbctx, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.util.setup(m => m.kick(user.instance, bbctx.user, bbctx.user, 'Tag Kick'))
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
                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.username).thenReturn('other user');
                ctx.userService.setup(m => m.querySingle(bbctx, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.util.setup(m => m.kick(user.instance, bbctx.user, bbctx.user, 'Tag Kick'))
                    .verifiable(1)
                    .thenResolve('moderatorTooLow');
            }
        },
        {
            code: '{kick;other user;My reason here}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.userService.setup(m => m.querySingle(bbctx, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.util.setup(m => m.kick(user.instance, bbctx.user, bbctx.user, 'My reason here'))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{kick;other user;My reason here;x}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.userService.setup(m => m.querySingle(bbctx, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.util.setup(m => m.kick(user.instance, bbctx.user, ctx.users.authorizer, 'My reason here'))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{kick;other user;My reason here;}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.userService.setup(m => m.querySingle(bbctx, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.util.setup(m => m.kick(user.instance, bbctx.user, bbctx.user, 'My reason here'))
                    .verifiable(1)
                    .thenResolve('success');
            }
        }
    ]
});
