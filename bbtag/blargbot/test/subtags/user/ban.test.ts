import type { Entities } from '@bbtag/blargbot';
import { BBTagRuntimeError, NotANumberError, Subtag, UserNotFoundError } from '@bbtag/blargbot';
import { BanSubtag } from '@bbtag/blargbot/subtags';
import { argument } from '@blargbot/test-util/mock.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(BanSubtag),
    argCountBounds: { min: 1, max: 5 },
    cases: [
        {
            code: '{ban;abc}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 9, error: new UserNotFoundError('abc') }
            ],
            postSetup(bbctx, ctx) {
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'abc', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(undefined);
            }
        },
        {
            code: '{ban;other user}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.dependencies.users.setup(m => m.ban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, bbctx.runtime.user, 1, 'Tag Ban', Infinity))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{ban;other user}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.dependencies.users.setup(m => m.ban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, bbctx.runtime.user, 1, 'Tag Ban', Infinity))
                    .verifiable(1)
                    .thenResolve('alreadyBanned');
            }
        },
        {
            code: '{ban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('Bot has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.dependencies.users.setup(m => m.ban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, bbctx.runtime.user, 1, 'Tag Ban', Infinity))
                    .verifiable(1)
                    .thenResolve('memberTooHigh');
            }
        },
        {
            code: '{ban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('User has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.dependencies.users.setup(m => m.ban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, bbctx.runtime.user, 1, 'Tag Ban', Infinity))
                    .verifiable(1)
                    .thenResolve('moderatorNoPerms');
            }
        },
        {
            code: '{ban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('User has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.dependencies.users.setup(m => m.ban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, bbctx.runtime.user, 1, 'Tag Ban', Infinity))
                    .verifiable(1)
                    .thenResolve('moderatorTooLow');
            }
        },
        {
            code: '{ban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('Bot has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.dependencies.users.setup(m => m.ban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, bbctx.runtime.user, 1, 'Tag Ban', Infinity))
                    .verifiable(1)
                    .thenResolve('noPerms');
            }
        },
        {
            code: '{ban;other user;5}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.dependencies.users.setup(m => m.ban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, bbctx.runtime.user, 5, 'Tag Ban', Infinity))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{ban;other user;-1}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.dependencies.users.setup(m => m.ban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, bbctx.runtime.user, -1, 'Tag Ban', Infinity))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{ban;other user;abc}',
            expected: 'false',
            errors: [
                { start: 0, end: 20, error: new NotANumberError('abc').withDisplay('false') }
            ],
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
            }
        },
        {
            code: '{ban;other user;;My custom reason}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.dependencies.users.setup(m => m.ban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, bbctx.runtime.user, 1, 'My custom reason', Infinity))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{ban;other user;7;My custom reason}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.dependencies.users.setup(m => m.ban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, bbctx.runtime.user, 7, 'My custom reason', Infinity))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{ban;other user;;;5 days}',
            expected: '432000000',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.dependencies.users.setup(m => m.ban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, bbctx.runtime.user, 1, 'Tag Ban', 432000000))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{ban;other user;7;My custom reason;2 hours}',
            expected: '7200000',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.dependencies.users.setup(m => m.ban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, bbctx.runtime.user, 7, 'My custom reason', 7200000))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{ban;other user;;;;x}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.dependencies.users.setup(m => m.ban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, ctx.users.authorizer, 1, 'Tag Ban', Infinity))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{ban;other user;;;;false}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.dependencies.users.setup(m => m.ban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, ctx.users.authorizer, 1, 'Tag Ban', Infinity))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{ban;other user;;;;true}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.dependencies.users.setup(m => m.ban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, ctx.users.authorizer, 1, 'Tag Ban', Infinity))
                    .verifiable(1)
                    .thenResolve('success');
            }
        },
        {
            code: '{ban;other user;4;My custom reason;2 hours 30s;abc}',
            expected: '7230000',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(user.instance);
                ctx.dependencies.users.setup(m => m.ban(bbctx.runtime.guild, user.instance, bbctx.runtime.user, ctx.users.authorizer, 4, 'My custom reason', 7230000))
                    .verifiable(1)
                    .thenResolve('success');
            }
        }
    ]
});
