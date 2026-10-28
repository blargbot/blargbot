import { BBTagRuntimeError, UserNotFoundError } from '@blargbot/bbtag';
import type { KickMemberFeature } from '@blargbot/bbtag/subtags';
import { KickSubtag, ReasonSubtag, UserIdSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<KickMemberFeature>({ id: 'features' });
const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });
const reasonSubtag = new Mock<ReasonSubtag>({ id: 'ReasonSubtag' });

await runSubtagTests({
    subtag: new KickSubtag(features.instance),
    argCountBounds: { min: 1, max: 3 },
    names: ['kick'],
    otherSubtags: [userIdSubtag.instance, reasonSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });
        ctx.adoptSubtagMock(reasonSubtag, { type: ReasonSubtag });
    },
    postSetup(bbctx) {
        reasonSubtag.setup(m => m.get(bbctx)).resolves('@command.user');
    },
    cases: [
        {
            code: '{kick;abc}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('abc') }
            ],
            postSetup(bbctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, 'abc', $({ noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        },
        {
            code: '{kick;other user}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.kickMember($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    auditReason: 'Tag Kick'
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{kick;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to kick users!') }
            ],
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.kickMember($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    auditReason: 'Tag Kick'
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'bot', reason: 'I don\'t have permission to kick users!' });
            }
        },
        {
            code: '{kick;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to kick other user!') }
            ],
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.kickMember($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    auditReason: 'Tag Kick'
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'bot', reason: 'I don\'t have permission to kick other user!' });
            }
        },
        {
            code: '{kick;other user}',
            expected: '`User has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to kick users!') }
            ],
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.kickMember($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    auditReason: 'Tag Kick'
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'authorizer', reason: 'You don\'t have permission to kick users!' });
            }
        },
        {
            code: '{kick;other user}',
            expected: '`User has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to kick other user!') }
            ],
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.kickMember($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    auditReason: 'Tag Kick'
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'authorizer', reason: 'You don\'t have permission to kick other user!' });
            }
        },
        {
            code: '{kick;other user;My reason here}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.kickMember($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    auditReason: 'My reason here'
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{kick;other user;My reason here;x}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.kickMember($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.authorizerId,
                    auditReason: 'My reason here'
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{kick;other user;My reason here;}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.kickMember($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    auditReason: 'My reason here'
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        }
    ]
});
