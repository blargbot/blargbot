import { BBTagRuntimeError, UserNotFoundError } from '@blargbot/bbtag-engine';
import type { SetUserTimeoutFeature } from '@blargbot/bbtag-engine/subtags';
import { TimeoutSubtag, UserIdSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<SetUserTimeoutFeature>({ id: 'features' });
const userIdSubtag = createMockSubtag(UserIdSubtag);

await runSubtagTests({
    subtag: new TimeoutSubtag(features.instance),
    argCountBounds: { min: 2, max: 4 },
    names: ['timeout'],
    otherSubtags: [userIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(userIdSubtag);
    },
    cases: [
        {
            code: '{timeout;other user;abc}',
            expected: '`Invalid duration`',
            errors: [
                { error: new BBTagRuntimeError('Invalid duration') }
            ]
        },
        {
            code: '{timeout;abc;1s}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('abc') }
            ],
            setup(ctx) {
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'abc', $({ noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: 'Success',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberTimeout($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    reason: 'Tag Timeout',
                    duration: Temporal.Duration.from({ seconds: 1 })
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{timeout;other user;29d}',
            expected: 'Success',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberTimeout($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    reason: 'Tag Timeout',
                    duration: Temporal.Duration.from({ days: 29 })
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{timeout;other user;-1d}',
            expected: '`Invalid duration`',
            errors: [
                { error: new BBTagRuntimeError('Invalid duration') }
            ]
        },
        {
            code: '{timeout;other user;0s}',
            expected: '`User is not timed out`',
            errors: [
                { error: new BBTagRuntimeError('User is not timed out', 'other user is not timed out!') }
            ],
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberTimeout($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    reason: 'Tag Timeout',
                    duration: Temporal.Duration.from({ seconds: 0 })
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'noChange', reason: 'other user is not timed out!' });
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`User is already timed out`',
            errors: [
                { error: new BBTagRuntimeError('User is already timed out', 'other user is already timed out!') }
            ],
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberTimeout($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    reason: 'Tag Timeout',
                    duration: Temporal.Duration.from({ seconds: 1 })
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'noChange', reason: 'other user is already timed out!' });
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`Bot has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to (remove) time out (from) users!') }
            ],
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberTimeout($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    reason: 'Tag Timeout',
                    duration: Temporal.Duration.from({ seconds: 1 })
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'bot', reason: 'I don\'t have permission to (remove) time out (from) users!' });
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`Bot has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to (remove) time out (from) other user!') }
            ],
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberTimeout($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    reason: 'Tag Timeout',
                    duration: Temporal.Duration.from({ seconds: 1 })
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'bot', reason: 'I don\'t have permission to (remove) time out (from) other user!' });
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`User has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to (remove) time out (from) users!') }
            ],
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberTimeout($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    reason: 'Tag Timeout',
                    duration: Temporal.Duration.from({ seconds: 1 })
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'authorizer', reason: 'You don\'t have permission to (remove) time out (from) users!' });
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`User has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to (remove) time out (from) other user!') }
            ],
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberTimeout($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    reason: 'Tag Timeout',
                    duration: Temporal.Duration.from({ seconds: 1 })
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'authorizer', reason: 'You don\'t have permission to (remove) time out (from) other user!' });
            }
        }
    ]
});
