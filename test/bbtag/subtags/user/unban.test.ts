import { BBTagRuntimeError, UserNotFoundError } from '@blargbot/bbtag';
import type { UnbanUserFeature } from '@blargbot/bbtag/subtags';
import { ReasonSubtag, UnbanSubtag, UserIdSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<UnbanUserFeature>({ id: 'features' });
const userIdSubtag = createMockSubtag(UserIdSubtag);
const reasonSubtag = createMockSubtag(ReasonSubtag);

await runSubtagTests({
    subtag: new UnbanSubtag(features.instance),
    argCountBounds: { min: 1, max: 3 },
    names: ['unban'],
    otherSubtags: [userIdSubtag.instance, reasonSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(userIdSubtag);
        ctx.adoptMock(reasonSubtag);
        reasonSubtag.setup(m => m.get(ctx.bbtag)).resolves('@command.user');
    },
    cases: [
        {
            code: '{unban;abc}',
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
            code: '{unban;other user}',
            expected: 'true',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.unbanUser($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    auditReason: 'Tag Unban'
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{unban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('Bot has no permissions') }
            ],
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.unbanUser($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    auditReason: 'Tag Unban'
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'bot' });
            }
        },
        {
            code: '{unban;other user}',
            expected: 'false',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.unbanUser($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    auditReason: 'Tag Unban'
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'notBanned' });
            }
        },
        {
            code: '{unban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('User has no permissions') }
            ],
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.unbanUser($({
                    guildId: ctx.guildId,
                    targetId: userId,
                    moderatorId: ctx.userId,
                    authorizerId: ctx.userId,
                    auditReason: 'Tag Unban'
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'authorizer' });
            }
        },
        {
            code: '{unban;other user;My reason here}',
            expected: 'true',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.unbanUser($({
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
            code: '{unban;other user;My reason here;x}',
            expected: 'true',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.unbanUser($({
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
            code: '{unban;other user;My reason here;}',
            expected: 'true',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.unbanUser($({
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
