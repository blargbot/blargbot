import { NotANumberError, UserNotFoundError } from '@blargbot/bbtag-engine';
import type { WarnFeature } from '@blargbot/bbtag-engine/subtags';
import { UserIdSubtag, WarnSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<WarnFeature>({ id: 'features' });

const userIdSubtag = createMockSubtag(UserIdSubtag);

await runSubtagTests({
    subtag: new WarnSubtag(features.instance),
    argCountBounds: { min: 0, max: 3 },
    names: ['warn'],
    otherSubtags: [userIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(userIdSubtag);
    },
    cases: [
        {
            code: '{warn}',
            expected: '1',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, '', undefined))
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, '', undefined))
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, '', undefined))
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, 'other user', undefined))
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, '', undefined))
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, 'other user', undefined))
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, '', undefined))
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, 'other user', undefined))
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
            setup(ctx) {
                userIdSubtag.setup(m => m.query(ctx.bbtag, 'unknown user', undefined))
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, 'other user', undefined))
                    .resolves(userId)
                    .mustHappen(1);
            }
        }
    ]
});
