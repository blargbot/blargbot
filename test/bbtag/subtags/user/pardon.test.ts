import { NotANumberError, UserNotFoundError } from '@blargbot/bbtag';
import type { PardonFeature } from '@blargbot/bbtag/subtags';
import { PardonSubtag, UserIdSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<PardonFeature>({ id: 'features' });
const userIdSubtag = createMockSubtag(UserIdSubtag);

await runSubtagTests({
    subtag: new PardonSubtag(features.instance),
    argCountBounds: { min: 0, max: 3 },
    names: ['pardon'],
    otherSubtags: [userIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(userIdSubtag);
    },
    cases: [
        {
            code: '{pardon}',
            expected: '0',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, '', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.pardonUser($({ guildId: ctx.guildId, targetId: userId, moderatorId: ctx.userId, count: 1, reason: 'Tag Pardon' })))
                    .mustHappen(1)
                    .resolves(0);
            }
        },
        {
            code: '{pardon}',
            expected: '5',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, '', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.pardonUser($({ guildId: ctx.guildId, targetId: userId, moderatorId: ctx.userId, count: 1, reason: 'Tag Pardon' })))
                    .mustHappen(1)
                    .resolves(5);
            }
        },
        {
            code: '{pardon;}',
            expected: '3',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, '', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.pardonUser($({ guildId: ctx.guildId, targetId: userId, moderatorId: ctx.userId, count: 1, reason: 'Tag Pardon' })))
                    .mustHappen(1)
                    .resolves(3);
            }
        },
        {
            code: '{pardon;other user}',
            expected: '7',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, 'other user', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.pardonUser($({ guildId: ctx.guildId, targetId: userId, moderatorId: ctx.userId, count: 1, reason: 'Tag Pardon' })))
                    .mustHappen(1)
                    .resolves(7);
            }
        },
        {
            code: '{pardon;;6}',
            expected: '26',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, '', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.pardonUser($({ guildId: ctx.guildId, targetId: userId, moderatorId: ctx.userId, count: 6, reason: 'Tag Pardon' })))
                    .mustHappen(1)
                    .resolves(26);
            }
        },
        {
            code: '{pardon;other user;9}',
            expected: '0',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, 'other user', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.pardonUser($({ guildId: ctx.guildId, targetId: userId, moderatorId: ctx.userId, count: 9, reason: 'Tag Pardon' })))
                    .mustHappen(1)
                    .resolves(0);
            }
        },
        {
            code: '{pardon;;;My custom reason}',
            expected: '16',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, '', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.pardonUser($({ guildId: ctx.guildId, targetId: userId, moderatorId: ctx.userId, count: 1, reason: 'My custom reason' })))
                    .mustHappen(1)
                    .resolves(16);
            }
        },
        {
            code: '{pardon;other user;6;My custom reason}',
            expected: '6',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, 'other user', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.pardonUser($({ guildId: ctx.guildId, targetId: userId, moderatorId: ctx.userId, count: 6, reason: 'My custom reason' })))
                    .mustHappen(1)
                    .resolves(6);
            }
        },
        {
            code: '{pardon;unknown user}',
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
            code: '{pardon;other user;abc}',
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
