import type { Entities } from '@bbtag/blargbot';
import { BBTagRuntimeError, UserNotFoundError } from '@bbtag/blargbot';
import { TimeoutSubtag } from '@bbtag/blargbot/subtags';
import { argument } from '@blargbot/test-util/mock.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: TimeoutSubtag,
    argCountBounds: { min: 2, max: 4 },
    cases: [
        {
            code: '{timeout;other user;abc}',
            expected: '`Invalid duration`',
            errors: [
                { start: 0, end: 24, error: new BBTagRuntimeError('Invalid duration') }
            ]
        },
        {
            code: '{timeout;abc;1s}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 16, error: new UserNotFoundError('abc') }
            ],
            postSetup(bbctx, ctx) {
                ctx.inject.users.setup(m => m.querySingle(bbctx.runtime, 'abc', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(undefined);
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.inject.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.inject.users.setup(x => x.mute(user.instance, bbctx.runtime.user, bbctx.runtime.user, 1000, 'Tag Timeout'))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{timeout;other user;29d}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.inject.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.inject.users.setup(x => x.mute(user.instance, bbctx.runtime.user, bbctx.runtime.user, 2505600000, 'Tag Timeout'))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{timeout;other user;-1d}',
            expected: '`Invalid duration`',
            errors: [
                { start: 0, end: 24, error: new BBTagRuntimeError('Invalid duration') }
            ]
        },
        {
            code: '{timeout;other user;0s}',
            expected: '`User is not timed out`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User is not timed out', 'other user is not timed out!') }
            ],
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.username).thenReturn('other user');
                ctx.inject.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.inject.users.setup(x => x.unmute(user.instance, bbctx.runtime.user, bbctx.runtime.user, 'Tag Timeout'))
                    .verifiable(1)
                    .thenResolve('notTimedOut');
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`User is already timed out`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User is already timed out', 'other user is already timed out!') }
            ],
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.username).thenReturn('other user');
                ctx.inject.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.inject.users.setup(x => x.mute(user.instance, bbctx.runtime.user, bbctx.runtime.user, 1000, 'Tag Timeout'))
                    .verifiable(1)
                    .thenResolve('alreadyTimedOut');
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to (remove) time out (from) users!') }
            ],
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.inject.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.inject.users.setup(x => x.mute(user.instance, bbctx.runtime.user, bbctx.runtime.user, 1000, 'Tag Timeout'))
                    .verifiable(1)
                    .thenResolve('noPerms');
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to (remove) time out (from) other user!') }
            ],
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.username).thenReturn('other user');
                ctx.inject.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.inject.users.setup(x => x.mute(user.instance, bbctx.runtime.user, bbctx.runtime.user, 1000, 'Tag Timeout'))
                    .verifiable(1)
                    .thenResolve('memberTooHigh');
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to (remove) time out (from) users!') }
            ],
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.inject.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.inject.users.setup(x => x.mute(user.instance, bbctx.runtime.user, bbctx.runtime.user, 1000, 'Tag Timeout'))
                    .verifiable(1)
                    .thenResolve('moderatorNoPerms');
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to (remove) time out (from) other user!') }
            ],
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.username).thenReturn('other user');
                ctx.inject.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.inject.users.setup(x => x.mute(user.instance, bbctx.runtime.user, bbctx.runtime.user, 1000, 'Tag Timeout'))
                    .verifiable(1)
                    .thenResolve('moderatorTooLow');
            }
        }
    ]
});
