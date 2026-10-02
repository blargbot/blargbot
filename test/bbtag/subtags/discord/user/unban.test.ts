import { replacers, UserNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import { runSubtagTests } from '../../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.unbanReplacer,
    names: ['unban'],
    argCountBounds: { min: 1, max: 3 },
    cases: [
        {
            code: '{unban;abc}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 11, error: new UserNotFoundError('abc') }
            ],
            setup(ctx) {
                ctx.discord.setup((m, $) => m.queryUser('abc', $({ global: true, throw: UserNotFoundError })))
                    .rejects(new UserNotFoundError('abc'))
                    .mustHappen(1);
            }
        },
        {
            code: '{unban;other user}',
            expected: 'true',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .resolves(userId)
                    .mustHappen(1);
                ctx.discord.setup((m, $) => m.unban($({
                    userId,
                    authorizer: 'user',
                    reason: 'Tag Unban'
                }))).resolves(true)
                    .mustHappen(1);
            }
        },
        {
            code: '{unban;other user}',
            expected: 'false',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .resolves(userId)
                    .mustHappen(1);
                ctx.discord.setup((m, $) => m.unban($({
                    userId,
                    authorizer: 'user',
                    reason: 'Tag Unban'
                }))).resolves(false)
                    .mustHappen(1);
            }
        },
        // {
        //     code: '{unban;other user}',
        //     expected: '`Bot has no permissions`',
        //     errors: [
        //         { start: 0, end: 18, error: new BBTagRuntimeError('Bot has no permissions') }
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

        //         ctx.util.setup(x => x.unban(bbctx.guild, user.instance, bbctx.user, bbctx.user, 'Tag Unban'))
        //             .verifiable(1)
        //             .thenResolve('noPerms');
        //     }
        // },
        // {
        //     code: '{unban;other user}',
        //     expected: '`User has no permissions`',
        //     errors: [
        //         { start: 0, end: 18, error: new BBTagRuntimeError('User has no permissions') }
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

        //         ctx.util.setup(x => x.unban(bbctx.guild, user.instance, bbctx.user, bbctx.user, 'Tag Unban'))
        //             .verifiable(1)
        //             .thenResolve('moderatorNoPerms');
        //     }
        // },
        {
            code: '{unban;other user;My reason here}',
            expected: 'true',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .resolves(userId)
                    .mustHappen(1);
                ctx.discord.setup((m, $) => m.unban($({
                    userId,
                    authorizer: 'user',
                    reason: 'My reason here'
                }))).resolves(true)
                    .mustHappen(1);
            }
        },
        {
            code: '{unban;other user;My reason here;x}',
            expected: 'true',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .resolves(userId)
                    .mustHappen(1);
                ctx.discord.setup((m, $) => m.unban($({
                    userId,
                    authorizer: 'tag',
                    reason: 'My reason here'
                }))).resolves(true)
                    .mustHappen(1);
            }
        },
        {
            code: '{unban;other user;My reason here;}',
            expected: 'true',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ global: true, throw: UserNotFoundError })))
                    .resolves(userId)
                    .mustHappen(1);
                ctx.discord.setup((m, $) => m.unban($({
                    userId,
                    authorizer: 'user',
                    reason: 'My reason here'
                }))).resolves(true)
                    .mustHappen(1);
            }
        }
    ]
});
