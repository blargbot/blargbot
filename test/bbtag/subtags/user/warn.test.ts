import { NotANumberError, UserNotFoundError } from '@blargbot/bbtag';
import type { WarnFeature } from '@blargbot/bbtag/subtags';
import { UserIdSubtag, WarnSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<WarnFeature>({ id: 'features' });

const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });

await runSubtagTests({
    subtag: new WarnSubtag(features.instance),
    argCountBounds: { min: 0, max: 3 },
    names: ['warn'],
    otherSubtags: [userIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });
    },
    cases: [
        {
            code: '{warn}',
            expected: '1',
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(bbctx, '', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.warnUser($({ guildId: ctx.guildId, targetId: userId, moderatorId: ctx.userId, count: 1, reason: 'Tag Warning' })))
                    .mustHappen(1)
                    .resolves(1);
            }
        },
        {
            code: '{warn}',
            expected: '7',
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(bbctx, '', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.warnUser($({ guildId: ctx.guildId, targetId: userId, moderatorId: ctx.userId, count: 1, reason: 'Tag Warning' })))
                    .mustHappen(1)
                    .resolves(7);
            }
        },
        {
            code: '{warn;}',
            expected: '2',
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(bbctx, '', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.warnUser($({ guildId: ctx.guildId, targetId: userId, moderatorId: ctx.userId, count: 1, reason: 'Tag Warning' })))
                    .mustHappen(1)
                    .resolves(2);
            }
        },
        {
            code: '{warn;other user}',
            expected: '5',
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(bbctx, 'other user', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.warnUser($({ guildId: ctx.guildId, targetId: userId, moderatorId: ctx.userId, count: 1, reason: 'Tag Warning' })))
                    .mustHappen(1)
                    .resolves(5);
            }
        },
        {
            code: '{warn;;6}',
            expected: '29',
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(bbctx, '', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.warnUser($({ guildId: ctx.guildId, targetId: userId, moderatorId: ctx.userId, count: 6, reason: 'Tag Warning' })))
                    .mustHappen(1)
                    .resolves(29);
            }
        },
        {
            code: '{warn;other user;9}',
            expected: '9',
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(bbctx, 'other user', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.warnUser($({ guildId: ctx.guildId, targetId: userId, moderatorId: ctx.userId, count: 9, reason: 'Tag Warning' })))
                    .mustHappen(1)
                    .resolves(9);
            }
        },
        {
            code: '{warn;;;My custom reason}',
            expected: '16',
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(bbctx, '', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.warnUser($({ guildId: ctx.guildId, targetId: userId, moderatorId: ctx.userId, count: 1, reason: 'My custom reason' })))
                    .mustHappen(1)
                    .resolves(16);
            }
        },
        {
            code: '{warn;other user;6;My custom reason}',
            expected: '22',
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(bbctx, 'other user', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.warnUser($({ guildId: ctx.guildId, targetId: userId, moderatorId: ctx.userId, count: 6, reason: 'My custom reason' })))
                    .mustHappen(1)
                    .resolves(22);
            }
        },
        {
            code: '{warn;unknown user}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('unknown user') }
            ],
            postSetup(bbctx) {
                userIdSubtag.setup(m => m.query(bbctx, 'unknown user', undefined))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        },
        {
            code: '{warn;other user;abc}',
            expected: '`Not a number`',
            errors: [
                { error: new NotANumberError('abc') }
            ],
            postSetup(bbctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(bbctx, 'other user', undefined))
                    .resolves(userId)
                    .mustHappen(1);
            }
        }
    ]
});
