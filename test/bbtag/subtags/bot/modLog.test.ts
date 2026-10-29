import { UserNotFoundError } from '@blargbot/bbtag';
import type { AddModLogFeature } from '@blargbot/bbtag/subtags';
import { ModLogSubtag, UserIdSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<AddModLogFeature>({ id: 'features' });
const userIdSubtag = createMockSubtag(UserIdSubtag);

await runSubtagTests({
    subtag: new ModLogSubtag(features.instance),
    argCountBounds: { min: 2, max: 5 },
    names: ['modLog'],
    otherSubtags: [userIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(userIdSubtag);
    },
    cases: [
        {
            code: '{modlog;poke;023634983746234834}',
            expected: '',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '023634983746234834', $({ global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '', $({ global: true })))
                    .resolves(ctx.userId)
                    .mustHappen(1);
                features.setup((m, $) => m.addModLog($({
                    guildId: ctx.bbtag.root.guildId,
                    action: 'poke',
                    targetId: userId,
                    moderatorId: ctx.userId,
                    reason: '',
                    color: undefined
                }))).resolves(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;2365432687945234625}',
            expected: '',
            setup(ctx) {
                const user1Id = createSnowflake();
                const user2Id = createSnowflake();

                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '023634983746234834', $({ global: true })))
                    .resolves(user1Id)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '2365432687945234625', $({ global: true })))
                    .resolves(user2Id)
                    .mustHappen(1);
                features.setup((m, $) => m.addModLog($({
                    guildId: ctx.bbtag.root.guildId,
                    action: 'poke',
                    targetId: user1Id,
                    moderatorId: user2Id,
                    reason: '',
                    color: undefined
                }))).resolves(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;2365432687945234625;power abuse is fun}',
            expected: '',
            setup(ctx) {
                const user1Id = createSnowflake();
                const user2Id = createSnowflake();

                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '023634983746234834', $({ global: true })))
                    .resolves(user1Id)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '2365432687945234625', $({ global: true })))
                    .resolves(user2Id)
                    .mustHappen(1);
                features.setup((m, $) => m.addModLog($({
                    guildId: ctx.bbtag.root.guildId,
                    action: 'poke',
                    targetId: user1Id,
                    moderatorId: user2Id,
                    reason: 'power abuse is fun',
                    color: undefined
                }))).resolves(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;2365432687945234625;power abuse is fun;red}',
            expected: '',
            setup(ctx) {
                const user1Id = createSnowflake();
                const user2Id = createSnowflake();

                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '023634983746234834', $({ global: true })))
                    .resolves(user1Id)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '2365432687945234625', $({ global: true })))
                    .resolves(user2Id)
                    .mustHappen(1);
                features.setup((m, $) => m.addModLog($({
                    guildId: ctx.bbtag.root.guildId,
                    action: 'poke',
                    targetId: user1Id,
                    moderatorId: user2Id,
                    reason: 'power abuse is fun',
                    color: 0xff0000
                }))).resolves(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;;;}',
            expected: '',
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '023634983746234834', $({ global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '', $({ global: true })))
                    .resolves(ctx.userId)
                    .mustHappen(1);
                features.setup((m, $) => m.addModLog($({
                    guildId: ctx.bbtag.root.guildId,
                    action: 'poke',
                    targetId: userId,
                    moderatorId: ctx.userId,
                    reason: '',
                    color: undefined
                }))).resolves(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;;;}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('023634983746234834') }
            ],
            setup(ctx) {
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '023634983746234834', $({ global: true })))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        }
    ]
});
