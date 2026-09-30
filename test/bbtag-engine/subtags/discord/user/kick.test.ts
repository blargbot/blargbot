import { replacers, UserNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import { runSubtagTests } from '../../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.kickReplacer,
    names: ['kick'],
    argCountBounds: { min: 1, max: 3 },
    cases: [
        {
            code: '{kick;abc}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 10, error: new UserNotFoundError('abc') }
            ],
            setup(ctx) {
                ctx.locals.setup((m, $) => m.queryUser('abc', $.looksLike({ noLookup: true, throw: true })))
                    .rejects(new UserNotFoundError('abc'))
                    .mustHappen(1);
            }
        },
        {
            code: '{kick;other user}',
            expected: 'Success',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.locals.setup((m, $) => m.queryUser('other user', $({ noLookup: true, throw: true })))
                    .resolves(userId)
                    .mustHappen(1);
                ctx.locals.setup((m, $) => m.kickGuildMember($({
                    userId,
                    authorizer: 'user',
                    reason: 'Tag Kick'
                }))).resolves().mustHappen(1);
            }
        },
        // TODO: Migrate this once kick is impelemented
        // {
        //     code: '{kick;other user}',
        //     expected: '`Bot has no permissions`',
        //     errors: [
        //         { start: 0, end: 17, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to kick users!') }
        //     ],
        //     postSetup(bbctx, ctx) {
        //         const member = ctx.createMock(eris.Member);
        //         ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
        //             .verifiable(1)
        //             .thenResolve([member.instance]);

        //         ctx.util.setup(x => x.kick(member.instance, bbctx.user, bbctx.user, 'Tag Kick'))
        //             .verifiable(1)
        //             .thenResolve('noPerms');
        //     }
        // },
        // {
        //     code: '{kick;other user}',
        //     expected: '`Bot has no permissions`',
        //     errors: [
        //         { start: 0, end: 17, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to kick other user!') }
        //     ],
        //     postSetup(bbctx, ctx) {
        //         const member = ctx.createMock(eris.Member);
        //         const user = ctx.createMock(eris.User);
        //         member.setup(m => m.user).returns(user.instance);
        //         user.setup(m => m.username).returns('other user');
        //         ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
        //             .verifiable(1)
        //             .thenResolve([member.instance]);

        //         ctx.util.setup(x => x.kick(member.instance, bbctx.user, bbctx.user, 'Tag Kick'))
        //             .verifiable(1)
        //             .thenResolve('memberTooHigh');
        //     }
        // },
        // {
        //     code: '{kick;other user}',
        //     expected: '`User has no permissions`',
        //     errors: [
        //         { start: 0, end: 17, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to kick users!') }
        //     ],
        //     postSetup(bbctx, ctx) {
        //         const member = ctx.createMock(eris.Member);
        //         ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
        //             .verifiable(1)
        //             .thenResolve([member.instance]);

        //         ctx.util.setup(x => x.kick(member.instance, bbctx.user, bbctx.user, 'Tag Kick'))
        //             .verifiable(1)
        //             .thenResolve('moderatorNoPerms');
        //     }
        // },
        // {
        //     code: '{kick;other user}',
        //     expected: '`User has no permissions`',
        //     errors: [
        //         { start: 0, end: 17, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to kick other user!') }
        //     ],
        //     postSetup(bbctx, ctx) {
        //         const member = ctx.createMock(eris.Member);
        //         const user = ctx.createMock(eris.User);
        //         member.setup(m => m.user).returns(user.instance);
        //         user.setup(m => m.username).returns('other user');
        //         ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
        //             .verifiable(1)
        //             .thenResolve([member.instance]);

        //         ctx.util.setup(x => x.kick(member.instance, bbctx.user, bbctx.user, 'Tag Kick'))
        //             .verifiable(1)
        //             .thenResolve('moderatorTooLow');
        //     }
        // },
        {
            code: '{kick;other user;My reason here}',
            expected: 'Success',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.locals.setup((m, $) => m.queryUser('other user', $({ noLookup: true, throw: true })))
                    .resolves(userId)
                    .mustHappen(1);
                ctx.locals.setup((m, $) => m.kickGuildMember($({
                    userId,
                    authorizer: 'user',
                    reason: 'My reason here'
                }))).resolves().mustHappen(1);
            }
        },
        {
            code: '{kick;other user;My reason here;x}',
            expected: 'Success',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.locals.setup((m, $) => m.queryUser('other user', $({ noLookup: true, throw: true })))
                    .resolves(userId)
                    .mustHappen(1);
                ctx.locals.setup((m, $) => m.kickGuildMember($({
                    userId,
                    authorizer: 'tag',
                    reason: 'My reason here'
                }))).resolves().mustHappen(1);
            }
        },
        {
            code: '{kick;other user;My reason here;}',
            expected: 'Success',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.locals.setup((m, $) => m.queryUser('other user', $({ noLookup: true, throw: true })))
                    .resolves(userId)
                    .mustHappen(1);
                ctx.locals.setup((m, $) => m.kickGuildMember($({
                    userId,
                    authorizer: 'user',
                    reason: 'My reason here'
                }))).resolves().mustHappen(1);
            }
        }
    ]
});
