import { BBTagRuntimeError, NotANumberError, replacers, UserNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import { runSubtagTests } from '../../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.banReplacer,
    names: ['ban'],
    argCountBounds: { min: 1, max: 5 },
    cases: [
        {
            code: '{ban;abc}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 9, error: new UserNotFoundError('abc') }
            ],
            setup(ctx) {
                ctx.discord.setup((m, $) => m.queryUser('abc', $({ global: true, throw: UserNotFoundError })))
                    .rejects(new UserNotFoundError('abc'))
                    .mustHappen();
            }
        },
        {
            code: '{ban;other user}',
            expected: 'false',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(userId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId,
                    authorizer: 'user',
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: null
                }))).resolves(false).mustHappen(1);
            }
        },
        {
            code: '{ban;other user}',
            expected: 'true',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(userId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId,
                    authorizer: 'user',
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            code: '{ban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 16, error: new BBTagRuntimeError('Bot has no permissions') }
            ],
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(userId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId,
                    authorizer: 'user',
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: null
                }))).rejects(new BBTagRuntimeError('Bot has no permissions')).mustHappen(1);
            }
        },
        // TODO: migrate this test when the ban implementation is provided
        // {
        //     code: '{ban;other user}',
        //     expected: '`Bot has no permissions`',
        //     errors: [
        //         { start: 0, end: 16, error: new BBTagRuntimeError('Bot has no permissions') }
        //     ],
        //     postSetup(bbctx, ctx) {
        //         const member = ctx.createMock(eris.Member);
        //         const user = ctx.createMock(eris.User);
        //         member.setup(m => m.user).returns(user.instance);
        //         ctx.util.setup(m => m.getUser('other user'))
        //             .verifiable(1)
        //             .thenResolve(undefined);
        //         ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
        //             .verifiable(1)
        //             .thenResolve([member.instance]);

        //         ctx.util.setup(m => m.ban(bbctx.guild, user.instance, bbctx.user, bbctx.user, 1, 'Tag Ban', isDuration(Infinity)))
        //             .verifiable(1)
        //             .thenResolve('memberTooHigh');
        //     }
        // },
        // {
        //     code: '{ban;other user}',
        //     expected: '`User has no permissions`',
        //     errors: [
        //         { start: 0, end: 16, error: new BBTagRuntimeError('User has no permissions') }
        //     ],
        //     postSetup(bbctx, ctx) {
        //         const member = ctx.createMock(eris.Member);
        //         const user = ctx.createMock(eris.User);
        //         member.setup(m => m.user).returns(user.instance);
        //         ctx.util.setup(m => m.getUser('other user'))
        //             .verifiable(1)
        //             .thenResolve(undefined);
        //         ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
        //             .verifiable(1)
        //             .thenResolve([member.instance]);

        //         ctx.util.setup(m => m.ban(bbctx.guild, user.instance, bbctx.user, bbctx.user, 1, 'Tag Ban', isDuration(Infinity)))
        //             .verifiable(1)
        //             .thenResolve('moderatorNoPerms');
        //     }
        // },
        // {
        //     code: '{ban;other user}',
        //     expected: '`User has no permissions`',
        //     errors: [
        //         { start: 0, end: 16, error: new BBTagRuntimeError('User has no permissions') }
        //     ],
        //     postSetup(bbctx, ctx) {
        //         const member = ctx.createMock(eris.Member);
        //         const user = ctx.createMock(eris.User);
        //         member.setup(m => m.user).returns(user.instance);
        //         ctx.util.setup(m => m.getUser('other user'))
        //             .verifiable(1)
        //             .thenResolve(undefined);
        //         ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
        //             .verifiable(1)
        //             .thenResolve([member.instance]);

        //         ctx.util.setup(m => m.ban(bbctx.guild, user.instance, bbctx.user, bbctx.user, 1, 'Tag Ban', isDuration(Infinity)))
        //             .verifiable(1)
        //             .thenResolve('moderatorTooLow');
        //     }
        // },
        // {
        //     code: '{ban;other user}',
        //     expected: '`Bot has no permissions`',
        //     errors: [
        //         { start: 0, end: 16, error: new BBTagRuntimeError('Bot has no permissions') }
        //     ],
        //     postSetup(bbctx, ctx) {
        //         const member = ctx.createMock(eris.Member);
        //         const user = ctx.createMock(eris.User);
        //         member.setup(m => m.user).returns(user.instance);
        //         ctx.util.setup(m => m.getUser('other user'))
        //             .verifiable(1)
        //             .thenResolve(undefined);
        //         ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
        //             .verifiable(1)
        //             .thenResolve([member.instance]);

        //         ctx.util.setup(m => m.ban(bbctx.guild, user.instance, bbctx.user, bbctx.user, 1, 'Tag Ban', isDuration(Infinity)))
        //             .verifiable(1)
        //             .thenResolve('noPerms');
        //     }
        // },
        {
            code: '{ban;other user;5}',
            expected: 'true',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(userId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId,
                    authorizer: 'user',
                    daysToDelete: 5,
                    reason: 'Tag Ban',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            code: '{ban;other user;-1}',
            expected: 'true',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(userId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId,
                    authorizer: 'user',
                    daysToDelete: -1,
                    reason: 'Tag Ban',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            code: '{ban;other user;abc}',
            expected: 'false',
            errors: [
                { start: 0, end: 20, error: new (NotANumberError.withDisplay('false'))('abc') }
            ],
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(userId)
                    .mustHappen();
            }
        },
        {
            code: '{ban;other user;;My custom reason}',
            expected: 'true',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(userId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId,
                    authorizer: 'user',
                    daysToDelete: 1,
                    reason: 'My custom reason',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            code: '{ban;other user;7;My custom reason}',
            expected: 'true',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(userId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId,
                    authorizer: 'user',
                    daysToDelete: 7,
                    reason: 'My custom reason',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            code: '{ban;other user;;;5 days}',
            expected: '432000000',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(userId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId,
                    authorizer: 'user',
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: 5 * 24 * 60 * 60_000
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            code: '{ban;other user;7;My custom reason;2 hours}',
            expected: '7200000',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(userId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId,
                    authorizer: 'user',
                    daysToDelete: 7,
                    reason: 'My custom reason',
                    duration: 2 * 60 * 60_000
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            code: '{ban;other user;;;;x}',
            expected: 'true',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(userId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId,
                    authorizer: 'tag',
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            code: '{ban;other user;;;;false}',
            expected: 'true',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(userId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId,
                    authorizer: 'tag',
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            code: '{ban;other user;;;;true}',
            expected: 'true',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(userId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId,
                    authorizer: 'tag',
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    duration: null
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            code: '{ban;other user;4;My custom reason;2 hours 30s;abc}',
            expected: '7230000',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .returns(userId)
                    .mustHappen();
                ctx.discord.setup((m, $) => m.ban($({
                    userId,
                    authorizer: 'tag',
                    daysToDelete: 4,
                    reason: 'My custom reason',
                    duration: 2 * 60 * 60_000 + 30_000
                }))).resolves(true).mustHappen(1);
            }
        }
    ]
});
