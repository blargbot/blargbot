import { BBTagRuntimeError, replacers, UserNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import { runSubtagTests } from '../../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.timeoutReplacer,
    names: ['timeout'],
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
            setup(ctx) {
                ctx.locals.setup((m, $) => m.queryUser('abc', $({ noLookup: true, throw: true })))
                    .rejects(new UserNotFoundError('abc'))
                    .mustHappen(1);
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: 'Success',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.locals.setup((m, $) => m.queryUser('other user', $({ noLookup: true, throw: true })))
                    .resolves(userId)
                    .mustHappen(1);
                ctx.locals.setup((m, $) => m.timeoutGuildMember($({
                    userId,
                    authorizer: 'user',
                    duration: 1_000,
                    reason: 'Tag Timeout'
                }))).resolves(true)
                    .mustHappen(1);
            }
        },
        {
            code: '{timeout;other user;29d}',
            expected: 'Success',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.locals.setup((m, $) => m.queryUser('other user', $({ noLookup: true, throw: true })))
                    .resolves(userId)
                    .mustHappen(1);
                ctx.locals.setup((m, $) => m.timeoutGuildMember($({
                    userId,
                    authorizer: 'user',
                    duration: 29 * 24 * 60 * 60_000,
                    reason: 'Tag Timeout'
                }))).resolves(true)
                    .mustHappen(1);
            }
        },
        {
            code: '{timeout;other user;1d;}',
            expected: 'Success',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.locals.setup((m, $) => m.queryUser('other user', $({ noLookup: true, throw: true })))
                    .resolves(userId)
                    .mustHappen(1);
                ctx.locals.setup((m, $) => m.timeoutGuildMember($({
                    userId,
                    authorizer: 'user',
                    duration: 24 * 60 * 60_000,
                    reason: 'Tag Timeout'
                }))).resolves(true)
                    .mustHappen(1);
            }
        },
        {
            code: '{timeout;other user;1d;Because I can}',
            expected: 'Success',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.locals.setup((m, $) => m.queryUser('other user', $({ noLookup: true, throw: true })))
                    .resolves(userId)
                    .mustHappen(1);
                ctx.locals.setup((m, $) => m.timeoutGuildMember($({
                    userId,
                    authorizer: 'user',
                    duration: 24 * 60 * 60_000,
                    reason: 'Because I can'
                }))).resolves(true)
                    .mustHappen(1);
            }
        },
        {
            code: '{timeout;other user;1d;Because I can;}',
            expected: 'Success',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.locals.setup((m, $) => m.queryUser('other user', $({ noLookup: true, throw: true })))
                    .resolves(userId)
                    .mustHappen(1);
                ctx.locals.setup((m, $) => m.timeoutGuildMember($({
                    userId,
                    authorizer: 'user',
                    duration: 24 * 60 * 60_000,
                    reason: 'Because I can'
                }))).resolves(true)
                    .mustHappen(1);
            }
        },
        {
            code: '{timeout;other user;1d;Because I can;x}',
            expected: 'Success',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.locals.setup((m, $) => m.queryUser('other user', $({ noLookup: true, throw: true })))
                    .resolves(userId)
                    .mustHappen(1);
                ctx.locals.setup((m, $) => m.timeoutGuildMember($({
                    userId,
                    authorizer: 'tag',
                    duration: 24 * 60 * 60_000,
                    reason: 'Because I can'
                }))).resolves(true)
                    .mustHappen(1);
            }
        },
        {
            code: '{timeout;other user;1d;;x}',
            expected: 'Success',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.locals.setup((m, $) => m.queryUser('other user', $({ noLookup: true, throw: true })))
                    .resolves(userId)
                    .mustHappen(1);
                ctx.locals.setup((m, $) => m.timeoutGuildMember($({
                    userId,
                    authorizer: 'tag',
                    duration: 24 * 60 * 60_000,
                    reason: 'Tag Timeout'
                }))).resolves(true)
                    .mustHappen(1);
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
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.locals.setup((m, $) => m.queryUser('other user', $({ noLookup: true, throw: true })))
                    .resolves(userId)
                    .mustHappen(1);
                ctx.locals.setup((m, $) => m.timeoutGuildMember($({
                    userId,
                    authorizer: 'user',
                    duration: 0,
                    reason: 'Tag Timeout'
                }))).resolves(false)
                    .mustHappen(1);
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`User is already timed out`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('User is already timed out', 'other user is already timed out!') }
            ],
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.locals.setup((m, $) => m.queryUser('other user', $({ noLookup: true, throw: true })))
                    .resolves(userId)
                    .mustHappen(1);
                ctx.locals.setup((m, $) => m.timeoutGuildMember($({
                    userId,
                    authorizer: 'user',
                    duration: 1_000,
                    reason: 'Tag Timeout'
                }))).resolves(false)
                    .mustHappen(1);
            }
        }
        // TODO: Migrate these tests once timeoutGuildMember is implemented.
        // {
        //     code: '{timeout;other user;1s}',
        //     expected: '`Bot has no permissions`',
        //     errors: [
        //         { start: 0, end: 23, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to (remove) time out (from) users!') }
        //     ],
        //     postSetup(bbctx, ctx) {
        //         const member = ctx.createMock(eris.Member);

        //         ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
        //             .verifiable(1)
        //             .thenResolve([member.instance]);

        //         ctx.util.setup(x => x.timeout(member.instance, bbctx.user, bbctx.user, isDuration(1000), 'Tag Timeout'))
        //             .verifiable(1)
        //             .thenResolve('noPerms');
        //     }
        // },
        // {
        //     code: '{timeout;other user;1s}',
        //     expected: '`Bot has no permissions`',
        //     errors: [
        //         { start: 0, end: 23, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to (remove) time out (from) other user!') }
        //     ],
        //     postSetup(bbctx, ctx) {
        //         const member = ctx.createMock(eris.Member);
        //         const user = ctx.createMock(eris.User);
        //         user.setup(u => u.username).returns('other user');
        //         member.setup(m => m.user).returns(user.instance);

        //         ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
        //             .verifiable(1)
        //             .thenResolve([member.instance]);

        //         ctx.util.setup(x => x.timeout(member.instance, bbctx.user, bbctx.user, isDuration(1000), 'Tag Timeout'))
        //             .verifiable(1)
        //             .thenResolve('memberTooHigh');
        //     }
        // },
        // {
        //     code: '{timeout;other user;1s}',
        //     expected: '`User has no permissions`',
        //     errors: [
        //         { start: 0, end: 23, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to (remove) time out (from) users!') }
        //     ],
        //     postSetup(bbctx, ctx) {
        //         const member = ctx.createMock(eris.Member);

        //         ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
        //             .verifiable(1)
        //             .thenResolve([member.instance]);

        //         ctx.util.setup(x => x.timeout(member.instance, bbctx.user, bbctx.user, isDuration(1000), 'Tag Timeout'))
        //             .verifiable(1)
        //             .thenResolve('moderatorNoPerms');
        //     }
        // },
        // {
        //     code: '{timeout;other user;1s}',
        //     expected: '`User has no permissions`',
        //     errors: [
        //         { start: 0, end: 23, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to (remove) time out (from) other user!') }
        //     ],
        //     postSetup(bbctx, ctx) {
        //         const member = ctx.createMock(eris.Member);
        //         const user = ctx.createMock(eris.User);
        //         user.setup(u => u.username).returns('other user');
        //         member.setup(m => m.user).returns(user.instance);

        //         ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
        //             .verifiable(1)
        //             .thenResolve([member.instance]);

        //         ctx.util.setup(x => x.timeout(member.instance, bbctx.user, bbctx.user, isDuration(1000), 'Tag Timeout'))
        //             .verifiable(1)
        //             .thenResolve('moderatorTooLow');
        //     }
        // }
    ]
});
