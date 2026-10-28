import { BBTagRuntimeError, NotANumberError, UserNotFoundError } from '@blargbot/bbtag';
import type { BanUserFeature } from '@blargbot/bbtag/subtags';
import { BanSubtag, ReasonSubtag, UserIdSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<BanUserFeature>({ id: 'features' });
const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });
const reasonSubtag = new Mock<ReasonSubtag>({ id: 'ReasonSubtag' });

const now = Temporal.Instant.from('2026-09-22T22:20:00Z');
await runSubtagTests({
    subtag: new BanSubtag(features.instance),
    argCountBounds: { min: 1, max: 5 },
    names: ['ban'],
    otherSubtags: [userIdSubtag.instance, reasonSubtag.instance],
    setup(ctx, _, test) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });
        ctx.adoptSubtagMock(reasonSubtag, { type: ReasonSubtag });
        test.mock.method(Temporal.Now, 'instant', () => now);
    },
    postSetup(bbctx) {
        reasonSubtag.setup(m => m.get(bbctx)).resolves('@command.user');
    },
    cases: [
        {
            code: '{ban;abc}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('abc') }
            ],
            postSetup(bbctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, 'abc', $({ noLookup: true, global: true })))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        },
        {
            code: '{ban;other user}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    daysToDelete: 1,
                    auditReason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    daysToDelete: 1,
                    auditReason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('Bot has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    daysToDelete: 1,
                    auditReason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'bot' });
            }
        },
        {
            code: '{ban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('User has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    daysToDelete: 1,
                    auditReason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'authorizer' });
            }
        },
        {
            code: '{ban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('User has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    daysToDelete: 1,
                    auditReason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'authorizer' });
            }
        },
        {
            code: '{ban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('Bot has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    daysToDelete: 1,
                    auditReason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'bot' });
            }
        },
        {
            code: '{ban;other user;5}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    daysToDelete: 5,
                    auditReason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;-1}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    daysToDelete: -1,
                    auditReason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;abc}',
            expected: 'false',
            errors: [
                { error: new NotANumberError('abc').withDisplay('false') }
            ],
            postSetup(bbctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
            }
        },
        {
            code: '{ban;other user;;My custom reason}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    daysToDelete: 1,
                    auditReason: 'My custom reason',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;7;My custom reason}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    daysToDelete: 7,
                    auditReason: 'My custom reason',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;;;5 days}',
            expected: '432000000',
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    daysToDelete: 1,
                    auditReason: 'Tag Ban',
                    unbanAfter: Temporal.Duration.from({ days: 5 })
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;7;My custom reason;2 hours}',
            expected: '7200000',
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    daysToDelete: 7,
                    auditReason: 'My custom reason',
                    unbanAfter: Temporal.Duration.from({ hours: 2 })
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;;;;x}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const authorizerId = ctx.authorizerId;
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId,
                    daysToDelete: 1,
                    auditReason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;;;;false}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const authorizerId = ctx.authorizerId;
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId,
                    daysToDelete: 1,
                    auditReason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;;;;true}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const authorizerId = ctx.authorizerId;
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId,
                    daysToDelete: 1,
                    auditReason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;4;My custom reason;2 hours 30s;abc}',
            expected: '7230000',
            postSetup(bbctx, ctx) {
                const authorizerId = ctx.authorizerId;
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId,
                    daysToDelete: 4,
                    auditReason: 'My custom reason',
                    unbanAfter: Temporal.Duration.from({ hours: 2, seconds: 30 })
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        }
    ]
});
