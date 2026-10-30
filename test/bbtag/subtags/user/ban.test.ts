import { BBTagRuntimeError, NotANumberError, UserNotFoundError } from '@blargbot/bbtag-engine';
import type { BanUserFeature } from '@blargbot/bbtag-engine/subtags';
import { BanSubtag, ReasonSubtag, UserIdSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<BanUserFeature>({ id: 'features' });
const userIdSubtag = createMockSubtag(UserIdSubtag);
const reasonSubtag = createMockSubtag(ReasonSubtag);

const now = Temporal.Instant.from('2026-09-22T22:20:00Z');
await runSubtagTests({
    subtag: new BanSubtag(features.instance),
    argCountBounds: { min: 1, max: 5 },
    names: ['ban'],
    otherSubtags: [userIdSubtag.instance, reasonSubtag.instance],
    setup(ctx, _, test) {
        ctx.adoptMock(features);
        ctx.adoptMock(userIdSubtag);
        ctx.adoptMock(reasonSubtag);
        test.mock.method(Temporal.Now, 'instant', () => now);
        reasonSubtag.setup(m => m.get(ctx.bbtag)).resolves('@command.user');
    },
    cases: [
        {
            code: '{ban;abc}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('abc') }
            ],
            setup(ctx) {
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'abc', $({ noLookup: true, global: true })))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        },
        {
            code: '{ban;other user}',
            expected: 'true',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
            }
        },
        {
            code: '{ban;other user;;My custom reason}',
            expected: 'true',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
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
            setup(ctx) {
                const authorizerId = ctx.authorizerId;
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
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
            setup(ctx) {
                const authorizerId = ctx.authorizerId;
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
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
            setup(ctx) {
                const authorizerId = ctx.authorizerId;
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
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
            setup(ctx) {
                const authorizerId = ctx.authorizerId;
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
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
